import datetime

from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.auth.models import Permission
from django.http import HttpResponse, Http404, HttpResponseRedirect, HttpRequest
from django.shortcuts import render, get_object_or_404
from django.urls import reverse, reverse_lazy
from django.views.generic import ListView, DetailView, UpdateView

from tasks.forms import UpdateTaskDueDateForm, TaskModelForm
# from tasks.forms import UpdateTaskDueDateForm, TaskModelForm
from tasks.models import Task


def current_datetime(request):
    html = f'<html><body><h1>{datetime.datetime.now()}</h1></body></html>'
    return HttpResponse(html)


def task_detail_v1(request, task_id: int):
    task = Task.objects.get(id=task_id)
    return HttpResponse(f'<html><body><h1>{task.description}</body></html>')


def task_detail_v2(request, task_id: int):
    try:
        task = Task.objects.get(id=task_id)
    except Task.DoesNotExist:
        raise Http404('Task not found')

    return render(request, 'tasks/task_detail.html', {'task': task})


def task_detail_v3(request, task_id: int):
    task = get_object_or_404(Task, pk=task_id)
    return render(request, 'tasks/task_detail.html', {'task': task})


class TaskDetailView(DetailView):
    model = Task
    template_name = 'tasks/task_detail.html'


class TaskListView(ListView):
    model = Task
    template_name = 'tasks/tasks_list.html'
    context_object_name = 'tasks'

    def get_queryset(self):
        tasks = Task.objects.select_related('project').prefetch_related('category').all()
        return tasks


def task_list(request):
    tasks = Task.objects.select_related('project').prefetch_related('category').all()
    return render(request, 'tasks/tasks_list.html', {'tasks': tasks})


def change_task_due_date(request, pk):
    task_instance = get_object_or_404(Task, pk=pk)

    # If this is a POST request then process the Form data
    if request.method == 'POST':
        # Create a form instance and populate it with data from the request (binding):
        form = UpdateTaskDueDateForm(request.POST)

        # Check if the form is valid:
        if form.is_valid():
            task_instance.due_date = form.cleaned_data['new_due_date']
            task_instance.title = form.cleaned_data['title']
            task_instance.save()

            return HttpResponseRedirect(reverse('task-list'))

    # If this is a GET (or any other method) create the default form.
    else:
        proposed_date = datetime.date.today() + datetime.timedelta(weeks=3)
        form = UpdateTaskDueDateForm(initial={'new_due_date': proposed_date})

    context = {'form': form, 'task_instance': task_instance}
    return render(request, 'tasks/task_update_2.html', context)


class TaskUpdateView(LoginRequiredMixin, UpdateView):
    model = Task
    form_class = TaskModelForm
    template_name = "tasks/task_update_2.html"
    context_object_name = "task_instance"
    success_url = reverse_lazy("task-list")


@login_required
def change_session(request: HttpRequest):
    view_counter = request.session.get('view_counter', 0)

    request.session['view_counter'] = view_counter + 1

    request.session.set_expiry(300)  # 5 minutes

    return HttpResponse(f'You visited this page {request.session['view_counter']} times!')
