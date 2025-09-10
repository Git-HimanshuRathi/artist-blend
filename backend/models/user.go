package models

import "time"

type User struct {
    ID           string    `bson:"_id,omitempty"`
    SpotifyID    string    `bson:"spotify_id"`
    Email        string    `bson:"email"`
    AccessToken  string    `bson:"access_token"`
    RefreshToken string    `bson:"refresh_token"`
    CreatedAt    time.Time `bson:"created_at"`
    UpdatedAt    time.Time `bson:"updated_at"`
}



