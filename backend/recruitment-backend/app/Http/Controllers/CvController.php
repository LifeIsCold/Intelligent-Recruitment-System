<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Models\Cv;
use App\Models\Skill;

class CvController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'cv' => 'nullable|file|mimes:pdf,doc,docx,txt|max:10240',
            'text_content' => 'nullable|string'
        ]);

        $user = $request->user();

        $file = $request->file('cv');
        $text = null;
        $originalName = null;
        $mime = null;
        $storagePath = null;

        try {
            if ($file) {
                $originalName = $file->getClientOriginalName();
                $mime = $file->getClientMimeType();
                $storagePath = $file->store('cvs');

                $extension = strtolower($file->extension());

                // Try PDF parsing via smalot if available
                if ($extension === 'pdf' && class_exists('\Smalot\PdfParser\Parser')) {
                    $parser = new \Smalot\PdfParser\Parser();
                    $pdf = $parser->parseFile($file->getPathname());
                    $text = $pdf->getText();
                } elseif (in_array($extension, ['doc', 'docx']) && class_exists('\PhpOffice\PhpWord\IOFactory')) {
                    $phpWord = \PhpOffice\PhpWord\IOFactory::load($file->getPathname());
                    $textParts = [];
                    foreach ($phpWord->getSections() as $section) {
                        $elements = $section->getElements();
                        foreach ($elements as $el) {
                            if (method_exists($el, 'getText')) {
                                $textParts[] = $el->getText();
                            }
                        }
                    }
                    $text = implode("\n", $textParts);
                } else {
                    // Fallback: try reading raw file contents
                    $text = @file_get_contents($file->getPathname());
                }
            } else {
                $text = $request->input('text_content');
            }
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to parse uploaded file', 'error' => $e->getMessage()], 422);
        }

        $text = $text ?? '';

        // Extract skills by matching against skills table (case-insensitive)
        $skillNames = Skill::pluck('name')->toArray();
        $found = [];
        foreach ($skillNames as $s) {
            if ($s && stripos($text, $s) !== false) {
                $found[] = $s;
            }
        }
        $found = array_values(array_unique($found));

        $cv = Cv::create([
            'user_id' => $user->id,
            'original_filename' => $originalName,
            'storage_path' => $storagePath,
            'mime_type' => $mime,
            'text_content' => $text,
            'extracted_skills' => $found,
            'parsed_at' => now()
        ]);

        // Attach found skills to user (default proficiency 3)
        foreach ($found as $skillName) {
            $skill = Skill::where('name', $skillName)->first();
            if ($skill) {
                $user->skills()->syncWithoutDetaching([$skill->id => ['proficiency' => 3]]);
            }
        }

        return response()->json($cv, 201);
    }
}
