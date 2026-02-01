<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Cv extends Model
{
    protected $fillable = [
        'user_id',
        'original_filename',
        'storage_path',
        'mime_type',
        'text_content',
        'extracted_skills',
        'parsed_at'
    ];

    protected $casts = [
        'extracted_skills' => 'array',
        'parsed_at' => 'datetime'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
