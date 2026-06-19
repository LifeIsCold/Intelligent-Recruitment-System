<?php
// database/migrations/2024_01_01_000000_create_scoring_weights_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateScoringWeightsTable extends Migration
{
    public function up()
    {
        Schema::create('scoring_weights', function (Blueprint $table) {
            $table->id();
            $table->morphs('weightable');
            $table->string('type'); // global, company, job
            $table->integer('required_skills_weight')->default(75);
            $table->integer('preferred_skills_weight')->default(0);
            $table->integer('experience_weight')->default(20);
            $table->integer('education_weight')->default(5);
            $table->float('similarity_threshold')->default(0.6);
            $table->json('custom_settings')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('scoring_weights');
    }
}