<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('applications', function (Blueprint $table) {
            $table->id();

            $table->foreignId('job_id')->constrained()->cascadeOnDelete();
            $table->foreignId('cv_id')->constrained()->cascadeOnDelete();

            $table->float('match_score')->nullable();
            $table->enum('status', ['pending', 'shortlisted', 'rejected'])->default('pending');

            $table->timestamps();

            $table->unique(['job_id', 'cv_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('applications');
    }
};
