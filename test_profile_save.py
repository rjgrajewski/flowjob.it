import requests

url = "http://localhost:8000/api/users/830e2f5b-b9d9-4820-94a2-e4d081b2a95c/onboarding"

payload = {
  "profile": {
    "first_name": "Test",
    "last_name": "User",
    "phone_number": "",
    "contact_email": "",
    "location": "",
    "bio": "",
    "profile_picture": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCE..."
  },
  "education": [],
  "experience": []
}

try:
    # We might need authentication or maybe not, based on the backend routes
    # Currently `save_onboarding` in backend does NOT seem to require auth header from what I saw? No, `user_id` is in the path.
    # Let's get the user ID from the database
    pass
