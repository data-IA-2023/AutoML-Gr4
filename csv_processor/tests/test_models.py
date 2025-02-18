import pytest
from django.contrib.auth.models import User
from csv_processor.models import CSVFile, Operation

@pytest.fixture
def user():
    return User.objects.create_user(username='testuser', password='testpass123')

@pytest.mark.django_db
class TestModels:
    def test_csv_file_creation(self, user):
        csv_file = CSVFile.objects.create(
            user=user,
            title="test.csv",
            file="csv_files/test.csv",
            rows_count=100,
            columns_count=5
        )
        assert csv_file.title == "test.csv"
        assert csv_file.rows_count == 100
        assert csv_file.columns_count == 5
        assert csv_file.user == user
        
    def test_operation_logging(self, user):
        csv_file = CSVFile.objects.create(
            user=user,
            title="test.csv",
            file="csv_files/test.csv",
            rows_count=100,
            columns_count=5
        )
        
        operation = Operation.objects.create(
            csv_file=csv_file,
            operation_type="clean_data",
            details="Removed duplicates"
        )
        
        assert operation.operation_type == "clean_data"
        assert operation.details == "Removed duplicates"
        assert operation.csv_file == csv_file
