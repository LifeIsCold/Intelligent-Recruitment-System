<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('jobs', function (Blueprint $table) {
            $table->id();
            // The company that posted the job
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();

            // Optional industry reference
            $table->foreignId('industry_id')->constrained()->cascadeOnDelete();

            // User who created the job (nullable if created by system)
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();

            $table->string('title');
            $table->text('description');

            // Work type/time and compensation
            $table->enum('work_type', ['remote', 'onsite'])->default('remote');
            $table->enum('work_time', ['full_time', 'part_time'])->default('full_time');
            $table->string('salary')->nullable();

            // Benefits and required skills
            $table->text('benefits')->nullable();
            $table->json('required_skills')->nullable();

            $table->enum('status', ['open', 'closed'])->default('open');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('jobs');
    }
};
