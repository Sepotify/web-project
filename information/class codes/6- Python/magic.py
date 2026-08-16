class Book:
    def __init__(self, title, author, pages):
        """Called when a new object is created."""
        self.title = title
        self.author = author
        self.pages = pages

    def __str__(self):
        """Called by str() or print(). Should return a readable string."""
        return f"'{self.title}' by {self.author}"

    def __len__(self):
        """Called by len(). Should return the length of the object."""
        return self.pages

    def __add__(self, other):
        """Called by the + operator. Allows adding two books together."""
        return self.pages + other.pages

    def __lt__(self, other):
        return self.pages < other.pages

    def __private_func(self):
        pass


# --- Using the Dunder Methods ---

# 1. __init__ is called here
book1 = Book("The Great Gatsby", "F. Scott Fitzgerald", 180)
book2 = Book("1984", "George Orwell", 328)

# 2. __str__ is called by print()
print(book1)  # Output: 'The Great Gatsby' by F. Scott Fitzgerald

# 3. __len__ is called by len()
print(f"Total pages in book1: {len(book1)}")  # Output: 180

# 4. __add__ is called by the + operator
total_pages = book1 + book2
print(f"Total pages of both books: {total_pages}")  # Output: 508


print(book1 < book2)

print(str(book1))
