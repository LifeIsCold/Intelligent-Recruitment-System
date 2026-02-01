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

            // Original uploaded file info
            $table->string('original_filename')->nullable();
            $table->string('storage_path')->nullable();
            $table->string('mime_type')->nullable();

            // Parsed/Extracted content
            $table->longText('text_content')->nullable();
            $table->json('extracted_skills')->nullable();
            $table->timestamp('parsed_at')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cvs');
    }
};
