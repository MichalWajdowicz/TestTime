from django.contrib.auth.models import User
from rest_framework import serializers
from rest_framework.serializers import ModelSerializer
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer, TokenObtainSerializer
from rest_framework_simplejwt.views import TokenObtainPairView


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        token['username'] = user.username
        token['email'] = user.email

        return token

class RegisterSerializer(serializers.ModelSerializer):
    # custom validation for all fields in the serializer and return the error message
    def validate(self, data):
        if User.objects.filter(username=data['username']).exists():
            raise serializers.ValidationError("A user with that username already exists.")
        if User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError("A user with that email already exists.")
        if len(data['password']) < 8:
            raise serializers.ValidationError("The password must be at least 8 characters long.")
        return data

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password','last_name','first_name')
        # make password write only
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(username=validated_data['username'], email=validated_data['email'], password=validated_data['password'],first_name=validated_data['first_name'],last_name=validated_data['last_name'] )

        return user