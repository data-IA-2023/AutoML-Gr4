from conftest import client
from flask import url_for, request, make_response
import os


def test_root_status_code_ok(client):
    response = client.get('/')
    # assert response.cookies['session'] != None
    assert response.status_code == 302


def test_root_redirection(client):
    response = client.get('/', follow_redirects=True)
    assert response.request.path == '/graph_editor'


# def test_upload_file(client):
#     response_setup = client.get('/')
#     session=response_setup.cookies['session']
#     response = client.post('/api/upload_file', data={'file': ('test_file.txt', 'test', 'text/plain')}).set_cookie("session", session)
#     assert response.status_code == 302
#     assert response.request.path == '/graph_editor'


def test_editor_status_code_ok(client):
    response = client.get('/graph_editor')
    assert response.status_code == 200