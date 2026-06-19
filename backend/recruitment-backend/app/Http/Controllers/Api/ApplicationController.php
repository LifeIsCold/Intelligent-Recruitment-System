<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\UserNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;

class ApplicationController extends Controller
{
    /**
     * Get user's applications
     */
    public function getUserApplications(Request $request)
    {
        try {
            $applications = Application::with(['job.company', 'cv'])
                ->where('user_id', $request->user()->id)
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $applications,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching user applications: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch applications'
            ], 500);
        }
    }

    /**
     * Get application details
     */
    public function getApplicationDetails($id)
    {
        try {
            $application = Application::with(['user', 'job.company', 'cv'])
                ->findOrFail($id);

            // Check authorization
            $user = auth()->user();
            if ($user->role === 'recruiter' && $user->company_id !== $application->job->company_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }

            if ($user->role === 'job_seeker' && $user->id !== $application->user_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'application' => $application,
                    'user_profile' => $application->user,
                    'cv_content' => $application->cv ? $application->cv->text_content : null,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching application details: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Application not found'
            ], 404);
        }
    }
    /**
     * Delete an application (job seeker)
     */
    public function destroy(Application $application)
    {
        try {
            // Check if user owns this application
            if ($application->user_id !== Auth::id()) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to delete this application'
                ], 403);
            }
            
            // Check if application can be deleted (only pending/reviewed)
            $allowedStatuses = ['pending', 'reviewed'];
            if (!in_array($application->status, $allowedStatuses)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete application with status: ' . $application->status
                ], 400);
            }
            
            // CREATE NOTIFICATION FIRST (while application still exists)
            UserNotification::create([
                'user_id' => $application->user_id,
                'application_id' => $application->id, // This is still valid
                'status_change' => 'application_deleted',
                'details' => [
                    'job_title' => $application->job->title ?? 'Unknown Job',
                    'job_id' => $application->job_id,
                    'applicant_name' => $application->user->name ?? 'Unknown User',
                    'applicant_email' => $application->user->email ?? 'Unknown Email',
                    'deleted_at' => now()->toDateTimeString()
                ],
                'is_read' => false
            ]);
            
            // THEN delete the application (this will cascade delete the notification we just created)
            // But that's fine because we already have the audit log we need
            $application->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Application deleted successfully'
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error deleting application: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete application: ' . $e->getMessage()
            ], 500);
        }
    }
    /**
     * Update application status with extra data for shortlist/hire
     */
     public function updateApplicationStatus(Request $request, $id)
    {
        Log::info('Updating application status', [
            'application_id' => $id,
            'request_data' => $request->all(),
            'user_id' => auth()->id()
        ]);

        try {
            $application = Application::with('job.company', 'user')
                ->where('id', $id)
                ->firstOrFail();

            // Authorize: only recruiter of the job's company
            if (auth()->user()->role !== 'recruiter' || auth()->user()->company_id !== $application->job->company_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized to update this application'
                ], 403);
            }

            $allowedStatuses = [
                Application::STATUS_PENDING,
                Application::STATUS_REVIEWED,
                Application::STATUS_SHORTLISTED,
                Application::STATUS_REJECTED,
                Application::STATUS_HIRED,
                Application::STATUS_OFFER_EXTENDED,
                Application::STATUS_DECLINED,
            ];

            $validator = Validator::make($request->all(), [
                'status' => 'required|in:' . implode(',', $allowedStatuses),
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $status = $request->status;
            $oldStatus = $application->status;

            // Handle hiring: instead of direct hired, send offer
            if ($status === Application::STATUS_HIRED) {
                $hireValidator = Validator::make($request->all(), [
                    'start_date' => 'required|date|after:today',
                    'workplace_address' => 'required|string|max:255',
                ]);

                if ($hireValidator->fails()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Hire details required',
                        'errors' => $hireValidator->errors()
                    ], 422);
                }

                $application->status = Application::STATUS_OFFER_EXTENDED;
                $application->start_date = $request->start_date;
                $application->workplace_address = $request->workplace_address;
                $application->save();

                // Notify seeker
                UserNotification::create([
                    'user_id' => $application->user_id,
                    'application_id' => $application->id,
                    'status_change' => 'offer_extended',
                    'details' => [
                        'job_title' => $application->job->title,
                        'company_name' => $application->job->company->name,
                        'start_date' => $request->start_date,
                        'workplace_address' => $request->workplace_address,
                    ],
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Offer sent to candidate',
                    'data' => $application->fresh()
                ]);
            }

            // For other statuses (shortlist, reject, etc.) – keep existing logic
            if ($status === Application::STATUS_SHORTLISTED) {
                $shortlistValidator = Validator::make($request->all(), [
                    'interview_scheduled_at' => 'required|date|after:now',
                    'interview_location' => 'required|string|max:255',
                    'interview_notes' => 'nullable|string',
                ]);

                if ($shortlistValidator->fails()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Interview details required',
                        'errors' => $shortlistValidator->errors()
                    ], 422);
                }

                $application->interview_scheduled_at = $request->interview_scheduled_at;
                $application->interview_location = $request->interview_location;
                $application->interview_notes = $request->interview_notes;
            }

            if ($request->has('notes')) {
                $application->notes = $request->notes;
            }

            $application->status = $status;
            $application->save();

            // Create notification if shortlisted
            if ($status === Application::STATUS_SHORTLISTED) {
                UserNotification::create([
                    'user_id' => $application->user_id,
                    'application_id' => $application->id,
                    'status_change' => 'shortlisted',
                    'details' => [
                        'job_title' => $application->job->title,
                        'company_name' => $application->job->company->name,
                        'interview_scheduled_at' => $request->interview_scheduled_at,
                        'interview_location' => $request->interview_location,
                    ],
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Application status updated successfully',
                'data' => $application->fresh()
            ]);

        } catch (\Exception $e) {
            Log::error('Error updating application status: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update application status'
            ], 500);
        }
    }

    /**
     * Seeker accepts the hire offer.
     */
    public function acceptOffer($id)
    {
        try {
            $application = Application::where('user_id', auth()->id())
                ->where('id', $id)
                ->where('status', Application::STATUS_OFFER_EXTENDED)
                ->firstOrFail();

            $application->update([
                'status' => Application::STATUS_HIRED,
                'hired_at' => now(),
            ]);

            // Notify recruiter
            $recruiterUser = $application->job->company->users()->where('role', 'recruiter')->first();
            if ($recruiterUser) {
                UserNotification::create([
                    'user_id' => $recruiterUser->id,
                    'application_id' => $application->id,
                    'status_change' => 'hired_accepted',
                    'details' => [
                        'job_title' => $application->job->title,
                        'applicant_name' => $application->user->name,
                    ],
                ]);
            }

            // Optional: auto-decline other pending offers for this seeker
            Application::where('user_id', auth()->id())
                ->where('status', Application::STATUS_OFFER_EXTENDED)
                ->where('id', '!=', $id)
                ->update(['status' => Application::STATUS_DECLINED]);

            return response()->json([
                'success' => true,
                'message' => 'Offer accepted successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Error accepting offer: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to accept offer'
            ], 500);
        }
    }

    /**
     * Seeker declines the hire offer.
     */
    public function declineOffer($id)
    {
        try {
            $application = Application::where('user_id', auth()->id())
                ->where('id', $id)
                ->where('status', Application::STATUS_OFFER_EXTENDED)
                ->firstOrFail();

            $application->update(['status' => Application::STATUS_DECLINED]);

            // Notify recruiter
            $recruiterUser = $application->job->company->users()->where('role', 'recruiter')->first();
            if ($recruiterUser) {
                UserNotification::create([
                    'user_id' => $recruiterUser->id,
                    'application_id' => $application->id,
                    'status_change' => 'hired_declined',
                    'details' => [
                        'job_title' => $application->job->title,
                        'applicant_name' => $application->user->name,
                    ],
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Offer declined'
            ]);

        } catch (\Exception $e) {
            Log::error('Error declining offer: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to decline offer'
            ], 500);
        }
    }

    /**
     * Get application stats for a job
     */
    public function getApplicationStats(Request $request, $jobId)
    {
        try {
            $stats = [
                'total' => Application::where('job_id', $jobId)->count(),
                'pending' => Application::where('job_id', $jobId)->where('status', Application::STATUS_PENDING)->count(),
                'reviewed' => Application::where('job_id', $jobId)->where('status', Application::STATUS_REVIEWED)->count(),
                'shortlisted' => Application::where('job_id', $jobId)->where('status', Application::STATUS_SHORTLISTED)->count(),
                'rejected' => Application::where('job_id', $jobId)->where('status', Application::STATUS_REJECTED)->count(),
                'hired' => Application::where('job_id', $jobId)->where('status', Application::STATUS_HIRED)->count(),
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching application stats: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch application stats'
            ], 500);
        }
    }
}