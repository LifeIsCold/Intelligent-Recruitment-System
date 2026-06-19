<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\JobController;
use App\Http\Controllers\Api\ApplicationController;
use App\Http\Controllers\Api\CvController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\SiteStatController;
use App\Http\Controllers\Api\SkillController;
use App\Http\Controllers\Api\CVScoringController;
use App\Http\Controllers\Api\UserNotificationController;
use App\Http\Controllers\Api\SavedJobController;
use App\Http\Controllers\Api\ScoringWeightController;

// Add CORS headers for all OPTIONS requests
Route::options('/{any}', function () {
    return response()->noContent()
        ->header('Access-Control-Allow-Origin', 'http://localhost:5173')
        ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
        ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-CSRF-TOKEN')
        ->header('Access-Control-Allow-Credentials', 'true');
})->where('any', '.*');

// PUBLIC TEST ROUTE - Place this BEFORE any middleware
Route::get('/test-python', function() {
    $pythonUrl = config('services.cv_scoring.url');
    
    try {
        $response = Http::timeout(5)->get($pythonUrl . '/health');
        
        return response()->json([
            'success' => true,
            'message' => 'Test route working',
            'python_service' => [
                'url' => $pythonUrl,
                'status' => $response->status(),
                'body' => $response->json(),
                'reachable' => $response->successful()
            ]
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Python service unreachable',
            'python_service' => [
                'url' => $pythonUrl,
                'error' => $e->getMessage()
            ]
        ]);
    }
});

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::get('/stats', [SiteStatController::class, 'index']);

// Public routes for industries and skills
Route::get('/industries', function () {
    return response()->json([
        'success' => true,
        'data' => \App\Models\Industry::all()
    ]);
});

Route::get('/skills', function () {
    return response()->json([
        'success' => true,
        'data' => \App\Models\Skill::all()
    ]);
});

Route::middleware('auth:sanctum')->group(function () {
    // Auth routes
    Route::get('/user/profile', [AuthController::class, 'getProfile']);
    Route::patch('/user/profile', [AuthController::class, 'updateProfile']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/user/change-password', [AuthController::class, 'changePassword']);
    
    // ========== PROFILE PICTURE ROUTES ==========
    Route::post('/user/profile-picture', [AuthController::class, 'uploadProfilePicture']);
    Route::delete('/user/profile-picture', [AuthController::class, 'removeProfilePicture']);
    
    // CV Management
    Route::get('/cvs', [CvController::class, 'index']);
    Route::post('/cvs', [CvController::class, 'store']);
    Route::put('/cvs/{id}/default', [CvController::class, 'setDefault']);
    Route::delete('/cvs/{id}', [CvController::class, 'destroy']);
    Route::get('/cvs/{id}/download', [CvController::class, 'download']);
    
    // CV SCORING ROUTES
    Route::post('/cvs/{id}/score', [CVScoringController::class, 'scoreCV']);
    Route::post('/cvs/score-text', [CVScoringController::class, 'scoreCVText']);
    Route::get('/cvs/{id}/score-history', [CVScoringController::class, 'getScoreHistory']);
    Route::get('/scores/{scoreId}', [CVScoringController::class, 'getScore']);
    
    // Notifications
    Route::get('/notifications', [UserNotificationController::class, 'index']);
    Route::post('/notifications/{id}/read', [UserNotificationController::class, 'markAsRead']);
    Route::post('/notifications/read-all', [UserNotificationController::class, 'markAllAsRead']);
    Route::get('/notifications/unread-count', [UserNotificationController::class, 'unreadCount']);

    // Template download
    Route::get('/cv-template', function () {
        $path = storage_path('app/public/templates/cv_template.xlsx');
        
        if (!file_exists($path)) {
            return response()->json([
                'success' => false,
                'message' => 'Template not found'
            ], 404);
        }
        
        return response()->download($path, 'cv_template.xlsx');
    });
    
    // Skill routes
    Route::get('/skills', [SkillController::class, 'index']);
    Route::post('/skills', [SkillController::class, 'store']);
    Route::post('/user/skills', [SkillController::class, 'addSkillsToUser']);
    Route::get('/user/skills', [SkillController::class, 'getUserSkills']);

    // Job routes for all users
    Route::get('/jobs', [JobController::class, 'index']);
    Route::get('/jobs/{job}', [JobController::class, 'show']);
    
    // Job application routes
    Route::post('/jobs/{job}/apply', [JobController::class, 'apply']);
    Route::get('/applications/my', [ApplicationController::class, 'getUserApplications']);

    // Recruiter job routes
    Route::get('/recruiter/jobs', [JobController::class, 'getRecruiterJobs']);
    
    // Job CRUD operations
    Route::post('/jobs', [JobController::class, 'store']);
    Route::put('/jobs/{job}', [JobController::class, 'update']);
    Route::put('/jobs/{job}/status', [JobController::class, 'updateJobStatus']);
    Route::delete('/jobs/{job}', [JobController::class, 'destroy']);
    
    // Job applications management
    Route::get('/jobs/{job}/applications', [JobController::class, 'getJobApplications']);
    Route::get('/jobs/{job}/application-stats', [ApplicationController::class, 'getApplicationStats']);
    
    // Application management
    Route::delete('/applications/{application}/delete', [ApplicationController::class, 'destroy']);
    Route::get('/applications/{application}', [ApplicationController::class, 'getApplicationDetails']);
    Route::put('/applications/{application}/status', [ApplicationController::class, 'updateApplicationStatus']);
    Route::get('/applications/{job}/stats', [ApplicationController::class, 'getApplicationStats']);
    Route::post('/applications/{application}/accept-offer', [ApplicationController::class, 'acceptOffer']);
    Route::post('/applications/{application}/decline-offer', [ApplicationController::class, 'declineOffer']);

    // Saved Jobs routes
    Route::get('/saved-jobs', [SavedJobController::class, 'index']);
    Route::post('/jobs/{job}/save', [SavedJobController::class, 'store']);
    Route::delete('/jobs/{job}/unsave', [SavedJobController::class, 'destroy']);
    Route::get('/jobs/{job}/saved-status', [SavedJobController::class, 'check']);

    // Scoring Weights Management
    Route::prefix('scoring-weights')->group(function () {
        Route::get('/global', [ScoringWeightController::class, 'getGlobalWeights']);
        Route::put('/global', [ScoringWeightController::class, 'updateGlobalWeights']);
    });

    Route::get('/companies/{company}/scoring-weights', [ScoringWeightController::class, 'getCompanyWeights']);
    Route::put('/companies/{company}/scoring-weights', [ScoringWeightController::class, 'updateCompanyWeights']);

    Route::get('/jobs/{job}/scoring-weights', [ScoringWeightController::class, 'getJobWeights']);
    Route::put('/jobs/{job}/scoring-weights', [ScoringWeightController::class, 'updateJobWeights']);

    // Test route
    Route::get('/test', function () {
        return response()->json([
            'success' => true,
            'message' => 'API is working',
            'user' => auth()->user()
        ]);
    });
});