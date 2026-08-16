from django.contrib import admin

from .models import Category, Project, User, Task

# Register your models here.
admin.site.register(Task)
admin.site.register(Category)
admin.site.register(Project)
admin.site.register(User)
