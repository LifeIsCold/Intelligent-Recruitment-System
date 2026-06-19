<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Cv extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'title',
        'is_default',
        'original_filename',
        'storage_path',
        'file_type', // Changed from mime_type
        'text_content',
        'structured_data',
        'extracted_skills',
        'experience_years',
        'education_level',
        'parsed_at',
    ];

    protected $casts = [
        'extracted_skills' => 'array',
        'structured_data' => 'array',
        'is_default' => 'boolean',
        'experience_years' => 'integer',
        'parsed_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function applications()
    {
        return $this->hasMany(Application::class);
    }

    /**
     * Set as default CV for the user
     */
    public function setAsDefault()
    {
        $this->user->cvs()->update(['is_default' => false]);
        $this->update(['is_default' => true]);
    }

    /**
     * Get the searchable content for matching
     */
    public function getSearchableContent()
    {
        if ($this->file_type === 'excel' && !empty($this->structured_data)) {
            return $this->extractTextFromStructuredData();
        }
        
        return $this->text_content ?? '';
    }

    private function extractTextFromStructuredData()
    {
        $text = '';
        $data = $this->structured_data ?? [];
        
        foreach ($data as $key => $value) {
            if (is_string($value)) {
                $text .= $value . ' ';
            } elseif (is_array($value)) {
                $text .= implode(' ', $value) . ' ';
            }
        }
        
        return trim($text);
    }
    public function scores()
    {
        return $this->hasMany(CVScore::class);
    }

    public function getTopScores($limit = 5)
    {
        return $this->scores()
            ->with('job.company')
            ->orderBy('total_score', 'desc')
            ->limit($limit)
            ->get();
    }
}