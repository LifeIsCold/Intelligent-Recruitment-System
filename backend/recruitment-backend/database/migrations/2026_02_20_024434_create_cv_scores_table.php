<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('cv_scores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cv_id')->constrained()->onDelete('cascade');
            $table->foreignId('job_id')->constrained()->onDelete('cascade');
            $table->foreignId('application_id')->nullable()->constrained()->onDelete('set null');
            
            // Score details
            $table->decimal('total_score', 5, 2);
            $table->json('score_breakdown')->nullable(); // Store breakdown of skills, experience, education scores
            $table->json('matched_skills')->nullable();
            $table->json('missing_skills')->nullable();
            $table->json('bge_analysis')->nullable(); // Store AI analysis results
            
            // Metadata
            $table->json('raw_response')->nullable(); // Store full API response for debugging
            $table->timestamp('scored_at')->useCurrent();
            $table->timestamps();
            
            // Indexes for performance
            $table->index(['cv_id', 'job_id']);
            $table->index('total_score');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cv_scores');
    }
};