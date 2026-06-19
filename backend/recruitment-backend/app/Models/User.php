<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Support\Facades\Storage;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'role',
        'company_id',
        'profile_picture',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    // Relationships
    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function cvs()
    {
        return $this->hasMany(Cv::class);
    }

    public function skills()
    {
        return $this->belongsToMany(Skill::class, 'user_skills')
                    ->withPivot('proficiency')
                    ->withTimestamps();
    }
    public function notifications()
    {
        return $this->hasMany(UserNotification::class)->latest();
    }
    public function savedJobs()
    {
        return $this->belongsToMany(Job::class, 'saved_jobs')
                    ->withTimestamps()
                    ->orderBy('saved_jobs.created_at', 'desc');
    }
}
