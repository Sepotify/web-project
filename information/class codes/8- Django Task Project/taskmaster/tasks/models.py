from django.db import models


class User(models.Model):
    username = models.CharField(max_length=30)
    name = models.CharField(max_length=50)
    avatar = models.ImageField(upload_to='avatars', null=True, blank=True)
    email = models.EmailField()
    phone_number = models.CharField(max_length=12)
    role = models.CharField(max_length=20)

    def __str__(self):
        return self.name + " | " + self.username


class Project(models.Model):
    name = models.CharField(max_length=40)
    description = models.TextField()
    owner = models.ForeignKey(User, on_delete=models.PROTECT)
    created_at = models.DateTimeField()


class Category(models.Model):
    name = models.CharField(max_length=20, unique=True)
    color = models.CharField(max_length=15)


class Status(models.TextChoices):
    TODO = 'TODO', 'To Do'
    DOING = 'DOING', 'Doing'
    DONE = 'DONE', 'Done'


class Task(models.Model):
    title = models.CharField(max_length=30, db_index=True)
    description = models.TextField()
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    category = models.ManyToManyField(Category)
    status = models.CharField(max_length=15, choices=Status.choices)
    priority = models.PositiveIntegerField()
    due_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
