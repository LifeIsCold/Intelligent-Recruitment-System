<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('cvs', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            // NEW: CV title and default flag
            $table->string('title')->nullable();
            $table->boolean('is_default')->default(false);

            // Original uploaded file info - UPDATED
            $table->string('original_filename')->nullable();
            $table->string('storage_path')->nullable();
            $table->enum('file_type', ['excel', 'text'])->default('text'); // CHANGED: Only excel or text

            // Parsed/Extracted content - UPDATED
            $table->longText('text_content')->nullable();
            $table->json('structured_data')->nullable(); // NEW: For parsed Excel data
            $table->json('extracted_skills')->nullable();
            
            // NEW: Additional extracted fields
            $table->integer('experience_years')->nullable();
            $table->string('education_level')->nullable();

            $table->timestamp('parsed_at')->nullable();
            $table->timestamps();

            // NEW: Index for performance
            $table->index(['user_id', 'is_default']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cvs');
    }
};