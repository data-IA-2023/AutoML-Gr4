from django import forms
from .models import CSVFile

class CSVUploadForm(forms.ModelForm):
    class Meta:
        model = CSVFile
        fields = ['file']
        labels = {
            'file': 'Fichier CSV'
        }
        help_texts = {
            'file': 'Sélectionnez un fichier CSV à analyser'
        }

    def clean_file(self):
        file = self.cleaned_data.get('file')
        if file:
            if not file.name.endswith('.csv'):
                raise forms.ValidationError('Le fichier doit être au format CSV')
            if file.size > 10 * 1024 * 1024:  # 10MB limit
                raise forms.ValidationError('La taille du fichier ne doit pas dépasser 10 MB')
        return file

class DataCleaningForm(forms.Form):
    def __init__(self, columns, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['column'].choices = [(col, col) for col in columns]

    column = forms.ChoiceField(
        label='Colonne',
        help_text='Sélectionnez la colonne à nettoyer'
    )

    action = forms.ChoiceField(
        label='Action',
        choices=[
            ('remove_nulls', 'Supprimer les lignes avec valeurs nulles'),
            ('fill_mean', 'Remplir avec la moyenne'),
            ('fill_median', 'Remplir avec la médiane'),
            ('fill_mode', 'Remplir avec la valeur la plus fréquente'),
            ('remove_duplicates', 'Supprimer les doublons'),
            ('remove_outliers', 'Supprimer les valeurs aberrantes')
        ],
        help_text='Choisissez l\'opération de nettoyage à effectuer'
    )

class ColumnOperationForm(forms.Form):
    def __init__(self, columns, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['column'].choices = [(col, col) for col in columns]

    column = forms.ChoiceField(
        label='Colonne',
        help_text='Sélectionnez la colonne pour l\'opération'
    )

    operation = forms.ChoiceField(
        label='Opération',
        choices=[
            ('rename', 'Renommer la colonne'),
            ('delete', 'Supprimer la colonne'),
            ('convert_numeric', 'Convertir en numérique'),
            ('convert_datetime', 'Convertir en date/heure'),
            ('replace_values', 'Remplacer des valeurs')
        ],
        help_text='Choisissez l\'opération à effectuer sur la colonne'
    )

    new_name = forms.CharField(
        label='Nouveau nom',
        required=False,
        help_text='Nouveau nom pour la colonne (uniquement pour l\'opération "Renommer")'
    )

    old_value = forms.CharField(
        label='Ancienne valeur',
        required=False,
        help_text='Valeur à remplacer (uniquement pour l\'opération "Remplacer")'
    )

    new_value = forms.CharField(
        label='Nouvelle valeur',
        required=False,
        help_text='Nouvelle valeur (uniquement pour l\'opération "Remplacer")'
    )
