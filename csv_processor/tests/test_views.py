import pytest
from django.urls import reverse
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.conf import settings
from csv_processor.models import CSVFile
import pandas as pd
import os
import shutil

@pytest.fixture
def user():
    return User.objects.create_user(username='testuser', password='testpass123')

@pytest.fixture
def authenticated_client(client, user):
    client.login(username='testuser', password='testpass123')
    return client

@pytest.fixture
def sample_csv():
    data = {
        'name': ['John', 'Jane', 'Bob'],
        'age': [25, 30, 35],
        'city': ['Paris', 'Lyon', 'Nice']
    }
    df = pd.DataFrame(data)
    csv_content = df.to_csv(index=False).encode('utf-8')
    return SimpleUploadedFile(
        "test.csv",
        csv_content,
        content_type="text/csv"
    )

@pytest.fixture
def uploaded_csv_file(user, sample_csv):
    # Ensure media directories exist
    os.makedirs(os.path.join(settings.MEDIA_ROOT, 'csv_files'), exist_ok=True)
    
    # Create actual file on disk
    file_path = os.path.join(settings.MEDIA_ROOT, 'csv_files', 'test.csv')
    with open(file_path, 'wb') as f:
        f.write(sample_csv.read())
    
    # Reset file pointer
    sample_csv.seek(0)
    
    # Create database record
    csv_file = CSVFile.objects.create(
        user=user,
        title="test.csv",
        file="csv_files/test.csv",
        rows_count=3,
        columns_count=3
    )
    return csv_file

@pytest.fixture(autouse=True)
def cleanup_media():
    yield
    # Cleanup after test
    if os.path.exists(os.path.join(settings.MEDIA_ROOT, 'csv_files')):
        shutil.rmtree(os.path.join(settings.MEDIA_ROOT, 'csv_files'))

@pytest.mark.django_db
class TestViews:
    def test_home_view(self, authenticated_client):
        response = authenticated_client.get(reverse('home'))
        assert response.status_code == 200
        
    def test_upload_csv(self, authenticated_client, sample_csv):
        response = authenticated_client.post(
            reverse('upload_csv'),
            {'csv_file': sample_csv},
            format='multipart'
        )
        assert response.status_code == 302  # Redirect after successful upload
        assert CSVFile.objects.count() == 1
        
    def test_view_csv(self, authenticated_client, uploaded_csv_file):
        response = authenticated_client.get(
            reverse('view_csv', kwargs={'pk': uploaded_csv_file.pk})
        )
        assert response.status_code == 200
        
    def test_delete_row(self, authenticated_client, uploaded_csv_file):
        response = authenticated_client.post(
            reverse('delete_row', kwargs={'pk': uploaded_csv_file.pk}),
            {'row_number': 1}
        )
        assert response.status_code == 302  # Redirect after deletion
        
    def test_clean_data(self, authenticated_client, uploaded_csv_file):
        response = authenticated_client.post(
            reverse('clean_data', kwargs={'pk': uploaded_csv_file.pk}),
            {
                'operation': 'remove_duplicates',
                'columns': ['name']
            }
        )
        assert response.status_code == 302  # Redirect after cleaning
        
    def test_column_operation(self, authenticated_client, uploaded_csv_file):
        response = authenticated_client.post(
            reverse('column_operation', kwargs={'pk': uploaded_csv_file.pk}),
            {
                'operation': 'rename_column',
                'column': 'name',
                'new_name': 'full_name'
            }
        )
        assert response.status_code == 302  # Redirect after operation
