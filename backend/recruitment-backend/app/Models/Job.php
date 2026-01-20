<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Job extends Model
{
    protected $fillable = ['title', 'description', 'skills'];

    protected $casts = [
        'skills' => 'array'
    ];
}
