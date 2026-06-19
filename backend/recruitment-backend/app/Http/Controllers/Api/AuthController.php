<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    // Register new user
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'role' => 'required|in:recruiter,job_seeker',
            'phone' => 'nullable|string',
            'company_name' => 'required_if:role,recruiter|string|max:255',
            'company_website' => 'nullable|string|url',
            'company_contact_person' => 'required_if:role,recruiter|string|max:255',
            'company_contact_phone' => 'nullable|string',
            'industry_id' => 'nullable|exists:industries,id'
        ]);

        // Create company if user is a recruiter
        $companyId = null;
        if ($request->role === 'recruiter') {
            $company = \App\Models\Company::create([
                'name' => $request->company_name,
                'website' => $request->company_website,
                'contact_person' => $request->company_contact_person,
                'contact_phone' => $request->company_contact_phone,
                'industry_id' => $request->industry_id
            ]);
            $companyId = $company->id;
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'phone' => $request->phone,
            'company_id' => $companyId
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        // Add profile picture URL (null for new users)
        $userData = $user->toArray();
        $userData['profile_picture_url'] = null;

        return response()->json([
            'success' => true,
            'message' => 'User registered successfully',
            'data' => [
                'user' => $userData,
                'token' => $token,
                'token_type' => 'Bearer'
            ]
        ], 201);
    }

    // Login user
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required'
        ]);

        $user = User::with('company')->where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        // Add profile picture URL to user data
        $userData = $user->toArray();
        $userData['profile_picture_url'] = $user->profile_picture ? Storage::disk('public')->url($user->profile_picture) : null;

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'data' => [
                'user' => $userData,
                'token' => $token,
                'token_type' => 'Bearer'
            ]
        ]);
    }

    // Get authenticated user profile
    public function getProfile(Request $request)
    {
        $user = $request->user()->load('company.industry', 'skills');
        
        // Add profile picture URL to the response
        $userData = $user->toArray();
        $userData['profile_picture_url'] = $user->profile_picture ? Storage::disk('public')->url($user->profile_picture) : null;
        
        return response()->json([
            'success' => true,
            'data' => $userData
        ]);
    }

    // Update user profile
    public function updateProfile(Request $request)
    {
        $user = $request->user();
        
        // Base validation for all users
        $rules = [
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|string|email|max:255|unique:users,email,' . $user->id,
            'phone' => 'nullable|string',
        ];
        
        // Add recruiter-specific validation
        if ($user->role === 'recruiter') {
            $rules = array_merge($rules, [
                'company_name' => 'nullable|string|max:255',
                'company_website' => 'nullable|url|max:255',
                'company_contact_person' => 'nullable|string|max:255',
                'company_contact_phone' => 'nullable|string',
                'industry_id' => 'nullable|exists:industries,id',
            ]);
        }
        
        $validator = Validator::make($request->all(), $rules);
        
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }
        
        // Update user data
        $userData = array_filter($request->only(['name', 'email', 'phone']));
        if (!empty($userData)) {
            $user->update($userData);
        }
        
        // Handle company data if user is a recruiter
        if ($user->role === 'recruiter') {
            $companyData = [];
            
            if ($request->has('company_name')) {
                $companyData['name'] = $request->company_name;
            }
            if ($request->has('company_website')) {
                $companyData['website'] = $request->company_website;
            }
            if ($request->has('company_contact_person')) {
                $companyData['contact_person'] = $request->company_contact_person;
            }
            if ($request->has('company_contact_phone')) {
                $companyData['contact_phone'] = $request->company_contact_phone;
            }
            if ($request->has('industry_id')) {
                $companyData['industry_id'] = $request->industry_id;
            }
            
            if (!empty($companyData)) {
                if ($user->company) {
                    $user->company->update($companyData);
                } else {
                    $companyData['user_id'] = $user->id;
                    $company = \App\Models\Company::create($companyData);
                    $user->company_id = $company->id;
                    $user->save();
                }
            }
        }
        
        // Refresh user with relationships
        $user->refresh();
        $user->load('company.industry', 'skills');
        
        // Add profile picture URL
        $userData = $user->toArray();
        $userData['profile_picture_url'] = $user->profile_picture ? Storage::disk('public')->url($user->profile_picture) : null;
        
        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully',
            'data' => [
                'user' => $userData,
                'company' => $user->company
            ]
        ]);
    }

    // Logout user (revoke token)
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully'
        ]);
    }
    
    /**
     * Change user password
     */
    public function changePassword(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'current_password' => 'required|string',
                'new_password' => 'required|string|min:8|confirmed|different:current_password',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = $request->user();

            if (!Hash::check($request->current_password, $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Current password is incorrect',
                    'errors' => [
                        'current_password' => ['The provided password does not match our records.']
                    ]
                ], 422);
            }

            $user->password = Hash::make($request->new_password);
            $user->save();

            Log::info('Password changed successfully for user: ' . $user->id);

            return response()->json([
                'success' => true,
                'message' => 'Password changed successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Password change error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to change password: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Upload profile picture
     */
    public function uploadProfilePicture(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'profile_picture' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = $request->user();
            
            if ($user->profile_picture && Storage::disk('public')->exists($user->profile_picture)) {
                Storage::disk('public')->delete($user->profile_picture);
            }
            
            $file = $request->file('profile_picture');
            $filename = time() . '_' . $user->id . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('profile_pictures', $filename, 'public');
            
            $user->update(['profile_picture' => $path]);
            
            $profilePictureUrl = $path ? Storage::disk('public')->url($path) : null;
            
            return response()->json([
                'success' => true,
                'message' => 'Profile picture uploaded successfully',
                'data' => [
                    'profile_picture' => $profilePictureUrl,
                    'profile_picture_path' => $path
                ]
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error uploading profile picture: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload profile picture: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove profile picture
     */
    public function removeProfilePicture(Request $request)
    {
        try {
            $user = $request->user();
            
            if ($user->profile_picture && Storage::disk('public')->exists($user->profile_picture)) {
                Storage::disk('public')->delete($user->profile_picture);
            }
            
            $user->update(['profile_picture' => null]);
            
            return response()->json([
                'success' => true,
                'message' => 'Profile picture removed successfully'
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error removing profile picture: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to remove profile picture: ' . $e->getMessage()
            ], 500);
        }
    }
}