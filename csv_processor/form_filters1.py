from django import template

register = template.Library()

@register.filter
def default_dict(value, key):
    """Returns the value from the dictionary using the provided key, or an empty string if not found."""
    try:
        return value.get(key, '')
    except:
        return ''
from django import template
register = template.Library()

@register.filter
def default_dict(value, key):
    return value.get(key, None)
from django import template

register = template.Library()

@register.filter
def default_dict(value, key):
    """Returns the value from the dictionary using the provided key, or an empty string if not found."""
    try:
        return value.get(key, '')
    except:
        return ''
from django import template
register = template.Library()

@register.filter
def default_dict(value, key):
    return value.get(key, None)
