<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CvController;
use App\Http\Controllers\Api\JobController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\IndustryController;
use App\Http\Controllers\Api\SkillController;
use App\Http\Controllers\Api\SiteStatController;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->post('/logout', [AuthController::class, 'logout']);

// Industries (public)
Route::get('/industries', [IndustryController::class, 'index']);

// Skills (public)
Route::get('/skills', [SkillController::class, 'index']);
Route::delete('/jobs/{job}', [JobController::class, 'destroy']);
// Protected skill routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/user/skills', [SkillController::class, 'addSkillsToUser']);
    Route::get('/user/skills', [SkillController::class, 'getUserSkills']);
    // Update user profile
    Route::patch('/user/profile', [\App\Http\Controllers\Api\AuthController::class, 'updateProfile']);
    // Get current authenticated user's profile
    Route::get('/user/profile', [\App\Http\Controllers\Api\AuthController::class, 'getProfile']);
});

// Jobs
Route::get('/jobs', [JobController::class, 'index']);
Route::post('/jobs', [JobController::class, 'store']);

// Site stats for landing promotions
Route::get('/site-stats', [SiteStatController::class, 'index']);
Route::middleware('auth:sanctum')->patch('/site-stats', [SiteStatController::class, 'update']);

// CV upload (protected)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/user/cv', [CvController::class, 'store']);
    Route::get('/user/cvs', [CvController::class, 'index'] ?? function(){ return response()->json([]); });
});

// Recruiter-specific routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/recruiter/jobs', [JobController::class, 'recruiterJobs']);
});

Route::get('/test', function () {
    return response()->json([
        'message' => 'API routes are working'
    ]);
});