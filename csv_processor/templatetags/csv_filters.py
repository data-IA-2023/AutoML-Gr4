from django import template

register = template.Library()

@register.filter
def get_item(dictionary, key):
    """
    فلتر مخصص للوصول إلى قيم القاموس باستخدام المفتاح
    """
    return dictionary.get(key, '')
