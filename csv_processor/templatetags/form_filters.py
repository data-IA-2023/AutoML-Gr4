from django import template

register = template.Library()

@register.filter(name='add_class')
def add_class(field, css_class):
    return field.as_widget(attrs={'class': css_class})

@register.filter
def get_range(total_pages, current_page):
    """
    Return a list of page numbers to display in pagination.
    Shows numbers around the current page and at the ends.
    """
    current_page = int(current_page)
    total_pages = int(total_pages)
    
    # Always show first page, last page, and pages around current page
    pages = set([1, total_pages])
    pages.update(range(max(1, current_page - 2), min(total_pages + 1, current_page + 3)))
    pages = sorted(list(pages))
    
    return pages

@register.filter(name='get_item')
def get_item(dictionary, key):
    """
    Get an item from a dictionary safely.
    """
    return dictionary.get(key, "")
from django import template

register = template.Library()

@register.filter
def default_dict(value, key):
    return value.get(key, None)