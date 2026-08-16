from django.urls import path

from .views import *

urlpatterns = [
    path('current-datetime/', current_datetime, name='current_datetime'),
    # path('', task_list, name='task-list'),
    path('', TaskListView.as_view(), name='task-list'),
    # path('<int:task_id>/', task_detail_v3, name='task-detail'), # taskmaster.com/task/1
    path('<int:pk>/', TaskDetailView.as_view(), name='task-detail'),  # taskmaster.com/task/1
    path('<int:pk>/change-due-date/', change_task_due_date, name='change-task-due-date'),
    path('<int:pk>/update/', TaskUpdateView.as_view(), name='change-task-due-date'),

    path('session/', change_session),
]
