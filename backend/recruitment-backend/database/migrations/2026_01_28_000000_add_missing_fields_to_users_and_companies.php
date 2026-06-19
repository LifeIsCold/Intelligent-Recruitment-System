<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Add fields to users table
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone')->nullable()->after('email');
        });

        // Add fields to companies table
        Schema::table('companies', function (Blueprint $table) {
            $table->string('website')->nullable()->after('description');
            $table->string('contact_person')->nullable()->after('website');
            $table->string('contact_email')->nullable()->after('contact_person');
            $table->string('contact_phone')->nullable()->after('contact_email');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('phone');
        });

        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumn(['website', 'contact_person', 'contact_email', 'contact_phone']);
        });
    }
};
