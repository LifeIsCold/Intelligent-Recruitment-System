<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        Schema::create('site_stats', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('total_users')->default(0);
            $table->unsignedBigInteger('total_companies')->default(0);
            $table->unsignedBigInteger('total_jobs')->default(0);
            $table->unsignedBigInteger('total_applications')->default(0);
            $table->timestamps();
        });

        // seed a single row to make reads simpler
        DB::table('site_stats')->insert([
            'total_users' => 0,
            'total_companies' => 0,
            'total_jobs' => 0,
            'total_applications' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down()
    {
        Schema::dropIfExists('site_stats');
    }
};
