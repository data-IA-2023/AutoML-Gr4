from django import template

register = template.Library()

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
