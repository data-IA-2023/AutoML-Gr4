# from django.shortcuts import render, redirect
# from django.contrib.auth import login, authenticate, logout
# from django.contrib.auth.forms import AuthenticationForm
# from django.contrib.auth.decorators import login_required
# from django.contrib import messages
# from .forms import UserRegisterForm, UploadFileForm
# import pandas as pd
# import plotly.express as px
# from django.http import HttpResponse

# # Register view
# def register(request):
#     if request.method == 'POST':
#         form = UserRegisterForm(request.POST)
#         if form.is_valid():
#             form.save()
#             return redirect('login')
#     else:
#         form = UserRegisterForm()
#     return render(request, 'accounts/register.html', {'form': form})

# # Login view
# def login_view(request):
#     if request.method == 'POST':
#         form = AuthenticationForm(request, data=request.POST)
#         if form.is_valid():
#             username = form.cleaned_data.get('username')
#             password = form.cleaned_data.get('password')
#             user = authenticate(username=username, password=password)
#             if user is not None:
#                 login(request, user)
#                 return redirect('upload_file')
#     else:
#         form = AuthenticationForm()
#     return render(request, 'accounts/login.html', {'form': form})

# # Logout view
# def logout_view(request):
#     logout(request)
#     return redirect('login')

# # File upload and data processing view
# @login_required
# def upload_file(request):
#     if request.method == 'POST':
#         form = UploadFileForm(request.POST, request.FILES)
#         if form.is_valid():
#             file = request.FILES['file']
#             file_type = file.name.split('.')[-1]

#             if file_type == 'csv':
#                 data = pd.read_csv(file)
#             elif file_type in ['xlsx', 'xls']:
#                 data = pd.read_excel(file)
#             else:
#                 return HttpResponse("Unsupported file format.", status=400)

#             # Handle columns cleaning
#             columns = data.columns.tolist()
#             if 'columns_to_clean' in request.POST:
#                 columns_to_clean = request.POST.getlist('columns_to_clean')
#                 for column in columns_to_clean:
#                     if data[column].dtype == 'object':
#                         data[column] = data[column].str.strip()

#             # Visualize the data using Plotly
#             fig = px.histogram(data, x=columns[0])  # Just an example using the first column
#             plot_html = fig.to_html(full_html=False)

#             context = {
#                 'form': form,
#                 'data_preview': data.head().to_html(),
#                 'plot_html': plot_html,
#                 'columns': columns
#             }
#             return render(request, 'accounts/upload.html', context)
#     else:
#         form = UploadFileForm()

#     return render(request, 'accounts/upload.html', {'form': form})


# def clean_column(request):
#     if request.method == 'POST':
#         selected_column = request.POST.get('selected_column')
#         print(f"Selected Column: {selected_column}")  # Debugging

#         # Get file path from session
#         file_path = request.session.get('file_path')
#         print(f"File Path: {file_path}")  # Debugging
#         if not file_path:
#             return redirect('upload_file')  # Redirect if no file is present

#         df = pd.read_csv(file_path)  # Reload the DataFrame
#         print(f"Columns in DataFrame: {df.columns}")  # Debugging
#         if selected_column in df.columns:
#             df[selected_column] = df[selected_column].dropna()
#             cleaned_column_data = df[selected_column].tolist()
#             request.session['cleaned_column'] = cleaned_column_data
#             return render(request, 'accounts/upload.html', {
#                 'columns': df.columns.tolist(),
#                 'cleaned_column': cleaned_column_data
#             })

#         return render(request, 'accounts/upload.html', {
#             'columns': df.columns.tolist(),
#             'error': 'Selected column does not exist in the file.'
#         })

#     return redirect('upload_file')


from django.shortcuts import render, redirect
from django.contrib.auth import login, authenticate, logout
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .forms import UserRegisterForm, UploadFileForm
import pandas as pd
import plotly.express as px
from django.http import HttpResponse

# Register view
def register(request):
    if request.method == 'POST':
        form = UserRegisterForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('login')
    else:
        form = UserRegisterForm()
    return render(request, 'accounts/register.html', {'form': form})

# Login view
def login_view(request):
    if request.method == 'POST':
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')
            user = authenticate(username=username, password=password)
            if user is not None:
                login(request, user)
                return redirect('upload_file')
    else:
        form = AuthenticationForm()
    return render(request, 'accounts/login.html', {'form': form})

# Logout view
def logout_view(request):
    logout(request)
    return redirect('login')

# File upload and data processing view
@login_required
def upload_file(request):
    if request.method == 'POST':
        form = UploadFileForm(request.POST, request.FILES)
        if form.is_valid():
            file = request.FILES['file']
            file_type = file.name.split('.')[-1]

            if file_type == 'csv':
                data = pd.read_csv(file)
            elif file_type in ['xlsx', 'xls']:
                data = pd.read_excel(file)
            else:
                return HttpResponse("Unsupported file format.", status=400)

            # Handle columns cleaning
            columns = data.columns.tolist()
            if 'columns_to_clean' in request.POST:
                columns_to_clean = request.POST.getlist('columns_to_clean')
                for column in columns_to_clean:
                    if data[column].dtype == 'object':
                        data[column] = data[column].str.strip()

            # Visualize the data using Plotly
            fig = px.histogram(data, x=columns[0])  # Just an example using the first column
            plot_html = fig.to_html(full_html=False)

            context = {
                'form': form,
                'data_preview': data.head().to_html(),
                'plot_html': plot_html,
                'columns': columns
            }
            return render(request, 'accounts/upload.html', context)
    else:
        form = UploadFileForm()

    return render(request, 'accounts/upload.html', {'form': form})


def clean_column(request):
    if request.method == 'POST':
        selected_column = request.POST.get('selected_column')
        print(f"Selected Column: {selected_column}")  # Debugging

        # Get file path from session
        file_path = request.session.get('file_path')
        print(f"File Path: {file_path}")  # Debugging
        if not file_path:
            return redirect('upload_file')  # Redirect if no file is present

        df = pd.read_csv(file_path)  # Reload the DataFrame
        print(f"Columns in DataFrame: {df.columns}")  # Debugging
        if selected_column in df.columns:
            df[selected_column] = df[selected_column].dropna()
            cleaned_column_data = df[selected_column].tolist()
            request.session['cleaned_column'] = cleaned_column_data
            return render(request, 'accounts/upload.html', {
                'columns': df.columns.tolist(),
                'cleaned_column': cleaned_column_data
            })

        return render(request, 'accounts/upload.html', {
            'columns': df.columns.tolist(),
            'error': 'Selected column does not exist in the file.'
        })

    return redirect('upload_file') 