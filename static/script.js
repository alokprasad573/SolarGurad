
        const dropZone = document.getElementById('drop-zone');
        const fileInput = document.getElementById('file-input');
        const previewContainer = document.getElementById('preview-container');
        const imagePreview = document.getElementById('image-preview');
        const predictBtn = document.getElementById('predict-btn');
        const loadingState = document.getElementById('loading-state');
        const resultSection = document.getElementById('result-section');
        const resultLabel = document.getElementById('result-label');
        const resultRec = document.getElementById('result-recommendation');
        const resultImage = document.getElementById('result-image');
        const removeBtn = document.getElementById('remove-btn');
        const confidenceVal = document.getElementById('confidence-val');
        const urgencyBadge = document.getElementById('urgency-badge');

        const metadata = {
            'Bird-drop': { rec: 'Partial shading detected. Wash the panel surface to prevent thermal stress and energy loss.', urgency: 'Maintenance Needed', color: 'bg-amber-100 text-amber-700' },
            'Clean': { rec: 'No surface anomalies found. Energy absorption is at maximum efficiency.', urgency: 'Optimal Condition', color: 'bg-emerald-100 text-emerald-700' },
            'Dusty': { rec: 'Moderate soiling layer detected. Efficiency is likely reduced by 5-10%.', urgency: 'Minor Cleaning', color: 'bg-blue-100 text-blue-700' },
            'Electrical-damage': { rec: 'High Risk: Internal electrical failure detected. Disconnect string to prevent fire hazard.', urgency: 'Urgent Danger', color: 'bg-red-100 text-red-700' },
            'Physical-Damage': { rec: 'Cracked glass or cell fractures found. Monitor for water ingress and rapid degradation.', urgency: 'Attention', color: 'bg-orange-100 text-orange-700' },
            'Snow-Covered': { rec: 'Total occlusion detected. Output is zero. Surface requires clearing.', urgency: 'Obstructed', color: 'bg-slate-200 text-slate-700' }
        };

        dropZone.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', function() { if (this.files && this.files[0]) handleFile(this.files[0]); });

        function handleFile(file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.src = e.target.result;
                dropZone.classList.add('hidden');
                previewContainer.classList.remove('hidden');
                resultSection.classList.add('hidden');
            };
            reader.readAsDataURL(file);
        }

        removeBtn.addEventListener('click', resetUI);
        function resetUI() {
            fileInput.value = '';
            dropZone.classList.remove('hidden');
            previewContainer.classList.add('hidden');
            resultSection.classList.add('hidden');
            loadingState.classList.add('hidden');
        }

        ['dragover', 'dragleave', 'drop'].forEach(evt => {
            dropZone.addEventListener(evt, e => { e.preventDefault(); e.stopPropagation(); });
        });

        dropZone.addEventListener('drop', e => {
            if (e.dataTransfer.files.length) {
                fileInput.files = e.dataTransfer.files;
                handleFile(e.dataTransfer.files[0]);
            }
        });

        predictBtn.addEventListener('click', async () => {
            const file = fileInput.files[0];
            if (!file) return;

            previewContainer.classList.add('hidden');
            loadingState.classList.remove('hidden');

            const formData = new FormData();
            formData.append('file', file);

            try {
                await new Promise(r => setTimeout(r, 1500)); 
                const response = await fetch('/predict', { method: 'POST', body: formData });
                
                if (!response.ok) {
                    const errText = await response.text();
                    throw new Error(`HTTP Error ${response.status}: ${errText || response.statusText}`);
                }

                const data = await response.json();
                
                if (data.message) { 
                    throw new Error(data.message);
                }
                
                loadingState.classList.add('hidden');
                resultSection.classList.remove('hidden');
                
                const info = metadata[data.class_name] || { rec: 'Standard operation.', urgency: 'N/A', color: 'bg-slate-100 text-slate-500' };
                
                resultLabel.innerText = data.class_name || "Unknown";
                resultRec.innerText = info.rec;
                urgencyBadge.innerText = info.urgency;
                urgencyBadge.className = `inline-block px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 ${info.color}`;
                resultImage.src = imagePreview.src;
                confidenceVal.innerText = (data.confidence || 0) + '%';

            } catch (error) {
                loadingState.classList.add('hidden');
                alert(`Error: ${error.message}`);
                resetUI();
            }

        });