from django import forms
import re

class VideoURLForm(forms.Form):
    url = forms.URLField(
        widget=forms.URLInput(attrs={
            'class': 'form-control',
            'placeholder': 'Paste TikTok video URL here',
            'autocomplete': 'off'
        })
    )

    def clean_url(self):
        url = self.cleaned_data['url']
        if 'tiktok.com' not in url:
            raise forms.ValidationError('Please enter a valid TikTok URL')
        return url
    
class ContactForm(forms.Form):
    name = forms.CharField(
        max_length=100,
        required=True,
        error_messages={
            'required': 'Please enter your name',
        }
    )
    email = forms.EmailField(
        required=True,
        error_messages={
            'required': 'Please enter your email',
            'invalid': 'Please enter a valid email address',
        }
    )
    subject = forms.CharField(
        max_length=200,
        required=True,
        error_messages={
            'required': 'Please enter a subject',
        }
    )
    message = forms.CharField(
        widget=forms.Textarea,
        required=True,
        error_messages={
            'required': 'Please enter your message',
        }
    )

    def clean_message(self):
        message = self.cleaned_data.get('message', '')
        if len(message) < 10:
            raise forms.ValidationError('Message must be at least 10 characters long')
        return message