from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import HttpResponse
from django.conf import settings
from django.core.paginator import Paginator, PageNotAnInteger, EmptyPage
from .models import CSVFile
from .forms import CSVUploadForm, DataCleaningForm, ColumnOperationForm
import pandas as pd
import numpy as np
import json
import os
import plotly.graph_objects as go
import plotly.express as px
import chardet
import csv
import io
from datetime import datetime

def detect_delimiter(file_path):
    """
    Detect the delimiter used in a CSV file by reading the first few lines.
    """
    possible_delimiters = [',', ';', '\t', '|', '_', '-']
    
    with open(file_path, 'r', encoding='utf-8') as file:
        # Read the first few lines
        first_line = file.readline()
        
        # Count occurrences of each delimiter
        delimiter_counts = {delimiter: first_line.count(delimiter) for delimiter in possible_delimiters}
        
        # Get the delimiter with maximum count
        max_delimiter = max(delimiter_counts.items(), key=lambda x: x[1])
        
        # If no delimiter found with count > 0, default to comma
        return max_delimiter[0] if max_delimiter[1] > 0 else ','

def ensure_media_dirs():
    """
    Ensure all required media directories exist
    """
    # Create main media directory
    media_root = settings.MEDIA_ROOT
    os.makedirs(media_root, exist_ok=True)
    
    # Create subdirectories
    csv_dir = os.path.join(media_root, 'csv_files')
    export_dir = os.path.join(media_root, 'exports')
    temp_dir = os.path.join(media_root, 'temp')
    
    for directory in [csv_dir, export_dir, temp_dir]:
        os.makedirs(directory, exist_ok=True)
    
    return csv_dir, export_dir, temp_dir

@login_required
def home(request):
    if request.method == 'POST':
        try:
            # Ensure media directories exist
            csv_dir, _, _ = ensure_media_dirs()
            
            # Process the uploaded file
            uploaded_file = request.FILES['file']
            
            # Create a unique filename
            timestamp = datetime.now().strftime('%Y-%m-%d_%Hh%M')
            safe_title = "".join(c for c in uploaded_file.name if c.isalnum() or c in (' ', '_', '-'))
            filename = f'upload_{safe_title}_{timestamp}.csv'
            filepath = os.path.join(csv_dir, filename)
            
            # Save the file
            with open(filepath, 'wb+') as destination:
                for chunk in uploaded_file.chunks():
                    destination.write(chunk)
            
            # Create the CSVFile record
            csv_file = CSVFile.objects.create(
                user=request.user,
                title=uploaded_file.name,
                file=f'csv_files/{filename}'
            )
            
            messages.success(request, 'Le fichier a été téléchargé avec succès !')
            return redirect('view_csv', pk=csv_file.pk)
            
        except Exception as e:
            messages.error(request, f'Erreur lors du téléchargement du fichier : {str(e)}')
            
    csv_files = CSVFile.objects.filter(user=request.user).order_by('-uploaded_at')
    return render(request, 'csv_processor/home.html', {
        'csv_files': csv_files,
        'form': CSVUploadForm()
    })

@login_required
def upload_csv(request):
    if request.method == 'POST':
        try:
            csv_file = request.FILES.get('csv_file')
            if not csv_file:
                messages.error(request, 'Aucun fichier n\'a été sélectionné')
                return redirect('home')

            # Ensure it's a CSV file
            if not csv_file.name.endswith('.csv'):
                messages.error(request, 'Le fichier doit être au format CSV')
                return redirect('home')

            # Create media directories if they don't exist
            ensure_media_dirs()

            # Save file
            file_path = os.path.join(settings.MEDIA_ROOT, 'csv_files', csv_file.name)
            with open(file_path, 'wb+') as destination:
                for chunk in csv_file.chunks():
                    destination.write(chunk)

            # Read file to get row and column count
            delimiter = detect_delimiter(file_path)
            df = pd.read_csv(file_path, delimiter=delimiter)

            # Create database record
            relative_path = os.path.join('csv_files', csv_file.name)
            csv_record = CSVFile.objects.create(
                user=request.user,
                title=csv_file.name,
                file=relative_path,
                rows_count=len(df),
                columns_count=len(df.columns)
            )

            messages.success(request, 'Fichier CSV téléchargé avec succès')
            return redirect('view_csv', pk=csv_record.pk)

        except Exception as e:
            messages.error(request, f'Erreur lors du téléchargement : {str(e)}')
            return redirect('home')

    return redirect('home')

@login_required
def view_csv(request, pk):
    csv_file = get_object_or_404(CSVFile, pk=pk, user=request.user)
    
    try:
        # Detect the delimiter
        delimiter = detect_delimiter(csv_file.file.path)
        
        # Read CSV with detected delimiter
        df = pd.read_csv(csv_file.file.path, delimiter=delimiter)
        
        # Create forms with current columns
        cleaning_form = DataCleaningForm(list(df.columns))
        column_form = ColumnOperationForm(list(df.columns))
        
        # Calculate summary statistics
        summary = {
            'rows': len(df),
            'columns': len(df.columns),
            'null_cells': df.isna().sum().sum(),
            'duplicate_rows': len(df) - len(df.drop_duplicates()),
            'memory_usage': f'{df.memory_usage(deep=True).sum() / 1024 / 1024:.2f} MB'
        }
        
        # Calculate column statistics
        column_stats = {}
        for column in df.columns:
            stats = {
                'name': column,
                'type': str(df[column].dtype),
                'null_count': df[column].isnull().sum(),
                'unique_count': df[column].nunique()
            }
            
            if pd.api.types.is_numeric_dtype(df[column]):
                stats.update({
                    'min': f"{df[column].min():.2f}",
                    'max': f"{df[column].max():.2f}",
                    'mean': f"{df[column].mean():.2f}",
                    'median': f"{df[column].median():.2f}"
                })
            
            column_stats[column] = stats
        
        # Create visualizations
        plots = []
        for column in df.columns:
            if pd.api.types.is_numeric_dtype(df[column]):
                # Histogram for numeric data
                fig = go.Figure()
                fig.add_trace(go.Histogram(x=df[column].dropna(), name=column))
                fig.update_layout(
                    title=f'Distribution de {column}',
                    xaxis_title=column,
                    yaxis_title='Fréquence',
                    showlegend=False,
                    template='plotly_white',
                    height=400,
                    margin=dict(l=50, r=50, t=50, b=50)
                )
                plots.append(fig.to_json())
            elif df[column].nunique() <= 10:
                # Bar chart for categorical data
                value_counts = df[column].value_counts()
                fig = go.Figure()
                fig.add_trace(go.Bar(
                    x=value_counts.index.astype(str).tolist(),
                    y=value_counts.values.tolist(),
                    name=column
                ))
                fig.update_layout(
                    title=f'Distribution de {column}',
                    xaxis_title=column,
                    yaxis_title='Nombre',
                    showlegend=False,
                    template='plotly_white',
                    height=400,
                    margin=dict(l=50, r=50, t=50, b=50)
                )
                plots.append(fig.to_json())
        
        # Convert DataFrame to list of rows for pagination
        data = df.replace({np.nan: None}).values.tolist()
        
        # Prepare pagination
        page = request.GET.get('page', 1)
        paginator = Paginator(data, 50)
        try:
            current_page = paginator.page(page)
        except PageNotAnInteger:
            current_page = paginator.page(1)
        except EmptyPage:
            current_page = paginator.page(paginator.num_pages)
        
        # Update view count
        csv_file.record_view()
        
        context = {
            'csv_file': csv_file,
            'columns': df.columns.tolist(),
            'cleaning_form': cleaning_form,
            'column_form': column_form,
            'summary': summary,
            'column_stats': column_stats,
            'plots': plots,
            'pagination': {
                'page': current_page,
                'total_pages': paginator.num_pages,
                'total_rows': len(df),
                'start_index': current_page.start_index(),
                'end_index': current_page.end_index()
            },
            'operations_log': csv_file.operations_log
        }
        
        return render(request, 'csv_processor/view.html', context)
        
    except Exception as e:
        messages.error(request, f'Erreur lors de la lecture du fichier : {str(e)}')
        return redirect('home')

@login_required
def delete_csv(request, pk):
    try:
        csv_file = get_object_or_404(CSVFile, pk=pk, user=request.user)
        csv_file.file.delete()  
        csv_file.delete()  
        messages.success(request, 'Le fichier a été supprimé avec succès')
    except Exception as e:
        messages.error(request, f'Erreur lors de la suppression du fichier : {str(e)}')
    return redirect('home')

@login_required
def clean_data(request, pk):
    csv_file = get_object_or_404(CSVFile, pk=pk, user=request.user)
    
    if request.method == 'POST':
        # Detect delimiter and read CSV
        delimiter = detect_delimiter(csv_file.file.path)
        df = pd.read_csv(csv_file.file.path, delimiter=delimiter)
        form = DataCleaningForm(list(df.columns), request.POST)
        
        if form.is_valid():
            try:
                column = form.cleaned_data['column']
                action = form.cleaned_data['action']
                
                # Perform operation
                if action == 'remove_nulls':
                    # Remove rows with null values in the specified column
                    original_count = len(df)
                    df = df.dropna(subset=[column])
                    removed_count = original_count - len(df)
                    operation_details = f'{removed_count} lignes contenant des valeurs vides ont été supprimées de la colonne {column}'
                
                elif action == 'fill_mean':
                    if pd.api.types.is_numeric_dtype(df[column]):
                        mean_value = df[column].mean()
                        df[column] = df[column].fillna(mean_value)
                        operation_details = f'Les valeurs vides ont été remplies avec la moyenne ({mean_value:.2f}) dans la colonne {column}'
                    else:
                        messages.error(request, 'La colonne doit être numérique pour utiliser la moyenne')
                        return redirect('view_csv', pk=pk)
                
                elif action == 'fill_median':
                    if pd.api.types.is_numeric_dtype(df[column]):
                        median_value = df[column].median()
                        df[column] = df[column].fillna(median_value)
                        operation_details = f'Les valeurs vides ont été remplies avec la médiane ({median_value:.2f}) dans la colonne {column}'
                    else:
                        messages.error(request, 'La colonne doit être numérique pour utiliser la médiane')
                        return redirect('view_csv', pk=pk)
                
                elif action == 'fill_mode':
                    mode_value = df[column].mode()[0]
                    df[column] = df[column].fillna(mode_value)
                    operation_details = f'Les valeurs vides ont été remplies avec la valeur la plus fréquente ({mode_value}) dans la colonne {column}'
                
                elif action == 'remove_duplicates':
                    original_count = len(df)
                    df = df.drop_duplicates(subset=[column])
                    removed_count = original_count - len(df)
                    operation_details = f'{removed_count} lignes en double ont été supprimées dans la colonne {column}'
                
                elif action == 'remove_outliers':
                    if pd.api.types.is_numeric_dtype(df[column]):
                        Q1 = df[column].quantile(0.25)
                        Q3 = df[column].quantile(0.75)
                        IQR = Q3 - Q1
                        original_count = len(df)
                        df = df[~((df[column] < (Q1 - 1.5 * IQR)) | (df[column] > (Q3 + 1.5 * IQR)))]
                        removed_count = original_count - len(df)
                        operation_details = f'{removed_count} valeurs aberrantes ont été supprimées de la colonne {column}'
                    else:
                        messages.error(request, 'La colonne doit être numérique pour supprimer les valeurs aberrantes')
                        return redirect('view_csv', pk=pk)
                
                # Save new file
                ensure_media_dirs()  # Make sure media directories exist
                base_name = os.path.splitext(csv_file.title)[0]
                new_filename = f'cleaned_{base_name}.csv'
                new_file_path = os.path.join(settings.MEDIA_ROOT, 'csv_files', new_filename)
                df.to_csv(new_file_path, index=False, sep=delimiter)
                
                # Create new CSV record
                relative_path = os.path.join('csv_files', new_filename)
                new_csv = CSVFile.objects.create(
                    user=request.user,
                    title=new_filename,
                    file=relative_path,
                    rows_count=len(df),
                    columns_count=len(df.columns)
                )
                
                # Log operation
                new_csv.log_operation('clean_data', operation_details)
                
                messages.success(request, operation_details)
                return redirect('view_csv', pk=new_csv.pk)
                
            except Exception as e:
                messages.error(request, f'Erreur lors du nettoyage des données : {str(e)}')
                return redirect('view_csv', pk=pk)
    
    return redirect('view_csv', pk=pk)

@login_required
def column_operation(request, pk):
    csv_file = get_object_or_404(CSVFile, pk=pk, user=request.user)
    
    if request.method == 'POST':
        # Detect delimiter and read CSV
        delimiter = detect_delimiter(csv_file.file.path)
        df = pd.read_csv(csv_file.file.path, delimiter=delimiter)
        form = ColumnOperationForm(list(df.columns), request.POST)
        
        if form.is_valid():
            try:
                column = form.cleaned_data['column']
                operation = form.cleaned_data['operation']
                new_name = form.cleaned_data.get('new_name')
                old_value = form.cleaned_data.get('old_value')
                new_value = form.cleaned_data.get('new_value')
                
                # Perform operation
                if operation == 'rename':
                    if new_name:
                        if new_name in df.columns:
                            messages.error(request, 'Une colonne avec ce nom existe déjà')
                            return redirect('view_csv', pk=pk)
                        df = df.rename(columns={column: new_name})
                        operation_details = f'La colonne {column} a été renommée en {new_name}'
                    else:
                        messages.error(request, 'Vous devez spécifier un nouveau nom pour la colonne')
                        return redirect('view_csv', pk=pk)
                
                elif operation == 'delete':
                    if len(df.columns) == 1:
                        messages.error(request, 'Impossible de supprimer la seule colonne du fichier')
                        return redirect('view_csv', pk=pk)
                    df = df.drop(columns=[column])
                    operation_details = f'La colonne {column} a été supprimée'
                
                elif operation == 'convert_numeric':
                    try:
                        original_values = df[column].copy()
                        df[column] = pd.to_numeric(df[column], errors='coerce')
                        nan_count = df[column].isna().sum() - original_values.isna().sum()
                        operation_details = f'La colonne {column} a été convertie en nombres ({nan_count} valeurs non convertibles)'
                    except Exception as e:
                        messages.error(request, f'Impossible de convertir la colonne en nombres : {str(e)}')
                        return redirect('view_csv', pk=pk)
                
                elif operation == 'convert_datetime':
                    try:
                        original_values = df[column].copy()
                        df[column] = pd.to_datetime(df[column], errors='coerce')
                        nan_count = df[column].isna().sum() - original_values.isna().sum()
                        operation_details = f'La colonne {column} a été convertie en dates ({nan_count} valeurs non convertibles)'
                    except Exception as e:
                        messages.error(request, f'Impossible de convertir la colonne en dates : {str(e)}')
                        return redirect('view_csv', pk=pk)
                
                elif operation == 'replace_values':
                    if old_value is not None and new_value is not None:
                        try:
                            # Convert values to appropriate type if column is numeric
                            if pd.api.types.is_numeric_dtype(df[column]):
                                # Replace comma with period for French number format
                                old_value = str(old_value).replace(',', '.')
                                new_value = str(new_value).replace(',', '.')
                                old_value = pd.to_numeric(old_value)
                                new_value = pd.to_numeric(new_value)
                            
                            # Count values to replace
                            mask = df[column].astype(str).str.replace(',', '.') == str(old_value)
                            count_before = mask.sum()
                            df.loc[mask, column] = new_value
                            operation_details = f'{count_before} valeurs ont été changées de {old_value} à {new_value} dans la colonne {column}'
                        except ValueError as e:
                            messages.error(request, f'Erreur de conversion: Assurez-vous que les valeurs sont numériques valides.')
                            return redirect('view_csv', pk=pk)
                    else:
                        messages.error(request, 'Vous devez spécifier la valeur ancienne et la valeur nouvelle')
                        return redirect('view_csv', pk=pk)
                
                # Save new file
                ensure_media_dirs()  # Make sure media directories exist
                base_name = os.path.splitext(csv_file.title)[0]
                new_filename = f'modified_{base_name}.csv'
                new_file_path = os.path.join(settings.MEDIA_ROOT, 'csv_files', new_filename)
                df.to_csv(new_file_path, index=False, sep=delimiter)
                
                # Create new CSV record
                relative_path = os.path.join('csv_files', new_filename)
                new_csv = CSVFile.objects.create(
                    user=request.user,
                    title=new_filename,
                    file=relative_path,
                    rows_count=len(df),
                    columns_count=len(df.columns)
                )
                
                # Log operation
                new_csv.log_operation('column_operation', operation_details)
                
                messages.success(request, operation_details)
                return redirect('view_csv', pk=new_csv.pk)
                
            except Exception as e:
                messages.error(request, f'Erreur lors de l\'opération sur la colonne : {str(e)}')
                return redirect('view_csv', pk=pk)
    
    return redirect('view_csv', pk=pk)

@login_required
def delete_row(request, pk):
    csv_file = get_object_or_404(CSVFile, pk=pk, user=request.user)
    
    if request.method == 'POST':
        try:
            # Get row number from form
            row_number = int(request.POST.get('row_number', 0))
            
            # Read CSV file
            delimiter = detect_delimiter(csv_file.file.path)
            df = pd.read_csv(csv_file.file.path, delimiter=delimiter)
            
            # Check if row number is valid
            if row_number < 0 or row_number >= len(df):
                messages.error(request, f'Numéro de ligne invalide. Doit être entre 0 et {len(df)-1}')
                return redirect('view_csv', pk=pk)
            
            # Delete the row
            df = df.drop(index=row_number)
            
            # Save new file
            ensure_media_dirs()
            base_name = os.path.splitext(csv_file.title)[0]
            new_filename = f'modified_{base_name}.csv'
            new_file_path = os.path.join(settings.MEDIA_ROOT, 'csv_files', new_filename)
            df.to_csv(new_file_path, index=False, sep=delimiter)
            
            # Create new CSV record
            relative_path = os.path.join('csv_files', new_filename)
            new_csv = CSVFile.objects.create(
                user=request.user,
                title=new_filename,
                file=relative_path,
                rows_count=len(df),
                columns_count=len(df.columns)
            )
            
            # Log operation
            operation_details = f'La ligne {row_number} a été supprimée'
            new_csv.log_operation('delete_row', operation_details)
            
            messages.success(request, operation_details)
            return redirect('view_csv', pk=new_csv.pk)
            
        except ValueError:
            messages.error(request, 'Veuillez entrer un numéro de ligne valide')
        except Exception as e:
            messages.error(request, f'Erreur lors de la suppression de la ligne : {str(e)}')
    
    return redirect('view_csv', pk=pk)

@login_required
def export_csv(request, pk):
    csv_file = get_object_or_404(CSVFile, pk=pk, user=request.user)
    try:
        # Ensure media directories exist and get export directory
        _, export_dir, _ = ensure_media_dirs()
        
        # Generate safe filename with timestamp
        timestamp = datetime.now().strftime('%Y-%m-%d_%Hh%M')
        safe_title = "".join(c for c in csv_file.title if c.isalnum() or c in (' ', '_', '-'))
        export_filename = f'export_{safe_title}_{timestamp}.csv'
        export_path = os.path.join(export_dir, export_filename)
        
        # Read the original CSV with detected delimiter
        delimiter = detect_delimiter(csv_file.file.path)
        df = pd.read_csv(csv_file.file.path, delimiter=delimiter)
        
        # Export to CSV
        df.to_csv(export_path, index=False)
        
        # Stream the file in the response
        with open(export_path, 'rb') as f:
            response = HttpResponse(f.read(), content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename="{export_filename}"'
            
            # Delete the temporary file after sending
            os.remove(export_path)
            return response
            
    except Exception as e:
        messages.error(request, f'Erreur lors de l\'exportation du fichier : {str(e)}')
        return redirect('view_csv', pk=pk)

@login_required
def export_excel(request, pk):
    csv_file = get_object_or_404(CSVFile, pk=pk, user=request.user)
    try:
        # Create media directories if they don't exist
        media_root = settings.MEDIA_ROOT
        export_dir = os.path.join(media_root, 'exports')
        os.makedirs(export_dir, exist_ok=True)

        # Generate safe filename with timestamp
        timestamp = datetime.now().strftime('%Y-%m-%d_%Hh%M')
        safe_title = "".join(c for c in csv_file.title if c.isalnum() or c in (' ', '_', '-'))
        export_filename = f'export_{safe_title}_{timestamp}.xlsx'
        export_path = os.path.join(export_dir, export_filename)

        # Read the original CSV with detected delimiter
        delimiter = detect_delimiter(csv_file.file.path)
        df = pd.read_csv(csv_file.file.path, delimiter=delimiter)

        # Create Excel writer
        with pd.ExcelWriter(export_path, engine='openpyxl') as writer:
            # Write main data
            df.to_excel(writer, sheet_name='Data', index=False)
            
            # Write statistics
            stats_df = pd.DataFrame({
                'Column': df.columns,
                'Data Type': df.dtypes.astype(str),
                'Non-Null Count': df.count(),
                'Null Count': df.isna().sum(),
                'Unique Values': [df[col].nunique() for col in df.columns]
            })
            stats_df.to_excel(writer, sheet_name='Statistics', index=False)
            
            # Write file information
            info_data = {
                'Information': ['Filename', 'Upload Date', 'Rows', 'Columns', 'File Size'],
                'Value': [
                    csv_file.title,
                    csv_file.upload_date.strftime('%Y-%m-%d %H:%M:%S'),
                    len(df),
                    len(df.columns),
                    f'{os.path.getsize(csv_file.file.path) / 1024:.2f} KB'
                ]
            }
            pd.DataFrame(info_data).to_excel(writer, sheet_name='File Info', index=False)

        # Stream the file in the response
        with open(export_path, 'rb') as f:
            response = HttpResponse(
                f.read(),
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            response['Content-Disposition'] = f'attachment; filename="{export_filename}"'
            
            # Delete the temporary file after sending
            os.remove(export_path)
            return response

    except Exception as e:
        messages.error(request, f'Erreur lors de l\'exportation du fichier : {str(e)}')
        return redirect('view_csv', pk=pk)

@login_required
def export_json(request, pk):
    csv_file = get_object_or_404(CSVFile, pk=pk, user=request.user)
    try:
        # Create media directories if they don't exist
        media_root = settings.MEDIA_ROOT
        export_dir = os.path.join(media_root, 'exports')
        os.makedirs(export_dir, exist_ok=True)

        # Generate safe filename with timestamp
        timestamp = datetime.now().strftime('%Y-%m-%d_%Hh%M')
        safe_title = "".join(c for c in csv_file.title if c.isalnum() or c in (' ', '_', '-'))
        export_filename = f'export_{safe_title}_{timestamp}.json'
        export_path = os.path.join(export_dir, export_filename)

        # Read the original CSV with detected delimiter
        delimiter = detect_delimiter(csv_file.file.path)
        df = pd.read_csv(csv_file.file.path, delimiter=delimiter)

        # Prepare JSON data
        json_data = {
            'metadata': {
                'filename': csv_file.title,
                'upload_date': csv_file.upload_date.strftime('%Y-%m-%d %H:%M:%S'),
                'rows': len(df),
                'columns': len(df.columns),
                'file_size': f'{os.path.getsize(csv_file.file.path) / 1024:.2f} KB'
            },
            'statistics': {
                col: {
                    'data_type': str(df[col].dtype),
                    'non_null_count': int(df[col].count()),
                    'null_count': int(df[col].isna().sum()),
                    'unique_values': int(df[col].nunique())
                } for col in df.columns
            },
            'data': df.to_dict(orient='records')
        }

        # Write JSON file
        with open(export_path, 'w', encoding='utf-8') as f:
            json.dump(json_data, f, ensure_ascii=False, indent=2)

        # Stream the file in the response
        with open(export_path, 'rb') as f:
            response = HttpResponse(f.read(), content_type='application/json')
            response['Content-Disposition'] = f'attachment; filename="{export_filename}"'
            
            # Delete the temporary file after sending
            os.remove(export_path)
            return response

    except Exception as e:
        messages.error(request, f'Erreur lors de l\'exportation du fichier : {str(e)}')
        return redirect('view_csv', pk=pk)
