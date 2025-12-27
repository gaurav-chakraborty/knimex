# Manual Testing Checklist
Run through these scenarios before deploying:

## Critical User Flows

### 1. File Upload & Processing (5 min)
- [ ] Visit homepage
- [ ] Click "Start Editing" or drag & drop file
- [ ] Upload JPEG with EXIF data
- [ ] Verify metadata detection shows GPS, camera, software
- [ ] Select "Social Media Upload" template
- [ ] Click "Process File"
- [ ] Verify processing completes in < 5 seconds
- [ ] Download cleaned file
- [ ] Verify file opens correctly
- [ ] Check file size (should be slightly smaller)
- [ ] Download change log
- [ ] Verify change log lists removed metadata

### 2. Different File Types (10 min)
Test each file type:
- [ ] JPEG image (with EXIF)
- [ ] PNG image (with text chunks)
- [ ] PDF document (with author metadata)
- [ ] MP3 audio (with ID3 tags)

### 3. Authentication Flow (5 min)
- [ ] Click "Join Free"
- [ ] Enter email and password
- [ ] Register account
- [ ] Verify redirect to dashboard/homepage
- [ ] Log out
- [ ] Log back in

### 4. Templates & Presets (5 min)
- [ ] Upload test file
- [ ] Try "Student Submission" template
- [ ] Verify correct checkboxes auto-selected
- [ ] Try "Job Application" template
- [ ] Verify different checkboxes selected

### 5. Pricing & Payments
- [ ] Visit /pricing
- [ ] Verify plans display correctly
- [ ] Test upgrade flow (if integrated)

## Total Time: ~90 minutes
