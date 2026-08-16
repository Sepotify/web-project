import datetime

from django.core.exceptions import ValidationError
from django import forms

from tasks.models import Task

class UpdateTaskDueDateForm(forms.Form):
    title = forms.CharField(help_text="Enter new title")
    new_due_date = forms.DateField(help_text="Enter new due date.")

    def clean_new_due_date(self):
        data = self.cleaned_data['new_due_date']
        # Check if a date is not in the past.
        if data < datetime.date.today():
            raise ValidationError('Invalid date - due date in past')
        # Check if a date is in the allowed range (+4 weeks from today).
        if data > datetime.date.today() + datetime.timedelta(weeks=4):
            raise ValidationError('Invalid date - due date more than 4 weeks ahead')
            # Remember to always return the cleaned data.
        return data


class TaskModelForm(forms.ModelForm):
    class Meta:
        model = Task
        fields = ['title', 'description', 'project', 'category', 'due_date']

