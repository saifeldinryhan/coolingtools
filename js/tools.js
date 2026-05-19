// ===================== tools.js =====================
// جميع الأدوات تستخدم الثوابت والدوال العامة من basic.js

window.openTool = function(toolId) {
    // إعلانات الإعلانات (نفس المنطق الأصلي)
    const AD_URL = 'https://omg10.com/4/10598715';
    const AD_COOLDOWN_MS = 3 * 60 * 1000;
    
    const checkInternet = async () => {
        if (!navigator.onLine) return false;
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1000);
            await fetch('https://www.google.com/favicon.ico', { mode: 'no-cors', signal: controller.signal });
            clearTimeout(timeoutId);
            return true;
        } catch { return false; }
    };

    const adClickTimesRaw = localStorage.getItem('toolAdClickTimes');
    let adClickTimes = adClickTimesRaw ? JSON.parse(adClickTimesRaw) : {};
    const now = Date.now();
    const lastTimeForTool = adClickTimes[toolId] || 0;
    
    if (now - lastTimeForTool >= AD_COOLDOWN_MS) {
        checkInternet().then(hasInternet => {
            if (hasInternet) {
                window.open(AD_URL, '_blank');
                adClickTimes[toolId] = now;
                localStorage.setItem('toolAdClickTimes', JSON.stringify(adClickTimes));
            }
        });
    }

    currentToolId = toolId;
    const body = document.getElementById('modalBody');
    const calcBtn = document.getElementById('calculateBtn');
    const modal = document.getElementById('toolModal');
    const title = document.getElementById('modalTitle');
    const resDiv = document.getElementById('resultDisplay');
    const settingsBtn = document.getElementById('settingsToolHeaderBtn');
    resDiv.classList.add('hidden');
    settingsBtn.style.display = 'none';
    modal.style.display = 'block';
    calcBtn.style.display = 'flex';
    body.innerHTML = '';
    document.getElementById('resultDisplay').innerHTML = '';
    calcBtn.onclick = null;

    const setContent = (html, onCalc) => {
        body.innerHTML = html;
        bindClearResultOnChange(body);
        if (onCalc) {
            calcBtn.onclick = () => withLoading(calcBtn, onCalc);
            setTimeout(() => bindEnterToCalculate(body, calcBtn), 10);
        } else {
            calcBtn.onclick = null;
        }
    };

    // ========== أدوات البيانات (جداول ثابتة) ==========
    if (toolId === 'ref_table') { 
        showRefTable(); 
        return; 
    }
    else if (toolId === 'pipe_sizing_table') { 
        showPipeSizingTable(); 
        return; 
    }
    else if (toolId === 'pipe_length_table') { 
        showPipeLengthTable(); 
        return; 
    }
    else if (toolId === 'wire_current_table') { 
        showWireCurrentTable(); 
        return; 
    }
    else if (toolId === 'capacitor_table') { 
        showCapacitorTable(); 
        return; 
    }
    else if (toolId === 'saved') {
        title.innerText = ' المحفوظات';
        calcBtn.style.display = 'none';
        settingsBtn.style.display = 'none';
        renderSaved();
        modal.style.display = 'block';
        return;
    }
    else if (toolId === 'install') {
        title.innerText = ' تثبيت التطبيق';
        setContent(`
            <div class="text-center space-y-2 p-2">
                <p class="text-gray-700 mb-2">اختر طريقة التثبيت المناسبة لجهازك</p>
                <button id="installPwaBtn" class="primary-btn w-full flex items-center justify-center gap-3 mb-4"><i class="fab fa-chrome"></i> تثبيت PWA (نسخة الويب)</button>
                <button id="installApkBtn" class="primary-btn w-full flex items-center justify-center gap-2 bg-green-600 mb-4"><i class="fab fa-android"></i> تحميل APK (أندرويد قريبا)</button>
                <div class="text-xs text-gray-500 pt-2">يمكنك دائماً استخدام التطبيق من المتصفح دون تثبيت</div>
            </div>
        `, null);
        calcBtn.style.display = 'none';
        settingsBtn.style.display = 'none';
        setTimeout(() => {
            const pwaBtn = document.getElementById('installPwaBtn');
            if (pwaBtn) pwaBtn.onclick = async () => { 
                if (deferredPrompt) { 
                    deferredPrompt.prompt(); 
                    const { outcome } = await deferredPrompt.userChoice; 
                    deferredPrompt = null; 
                    closeModal(); 
                } else { 
                    showToast(' المتصفح لا يدعم التثبيت', 'warning'); 
                } 
            };
            const apkBtn = document.getElementById('installApkBtn');
            if (apkBtn) apkBtn.onclick = () => { 
                window.open('https://example.com/cooling-tools.apk', '_blank'); 
                closeModal(); 
            };
        }, 50);
        return;
    }

    // ========== أدوات الذكاء الاصطناعي ==========
    else if (toolId === 'comp_search') {
        title.innerText = ' بحث ضواغط (AI) بالصور';
        
        if (!state.geminiApiKey) {
            setContent(`
                <div class="instruction-box p-3 text-center">
                    <i class="fas fa-key text-2xl text-orange-500 mb-2"></i>
                    <p> مطلوب مفتاح Gemini API من الإعدادات الرئيسية</p>
                    <button id="goToSettingsBtn" class="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg">انتقل إلى الإعدادات</button>
                </div>
            `, null);
            calcBtn.style.display = 'none';
            setTimeout(() => { 
                const settingsBtn = document.getElementById('goToSettingsBtn'); 
                if (settingsBtn) settingsBtn.onclick = () => { closeModal(); openMainSettings(); }; 
            }, 50);
            return;
        }

        setContent(`
            <div class="space-y-4">
                <div class="instruction-box bg-blue-50 p-3 rounded-lg text-sm">
                    <i class="fas fa-info-circle text-blue-600 ml-2"></i>
                    أدخل موديل الضاغط أو ارفع صورة للوحة البيانات (أو كلاهما)
                </div>
                <div class="flex flex-col sm:flex-row gap-2">
                    <input type="text" id="compModelInput" placeholder="مثال: Copeland ZR36K" 
                           class="flex-1 p-3 border-2 rounded-lg focus:outline-none focus:border-blue-500">
                    <button id="uploadImageBtn" class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg transition">
                        <i class="fas fa-image ml-1"></i> رفع صورة
                    </button>
                    <button id="searchCompBtn" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition">
                        <i class="fas fa-search ml-1"></i> بحث
                    </button>
                </div>
                <div id="compImagePreview" class="flex flex-wrap gap-2"></div>
                <div id="compLoadingIndicator" class="hidden text-center py-4">
                    <i class="fas fa-spinner fa-pulse text-blue-600 text-2xl"></i>
                    <p class="text-sm text-gray-500 mt-2">جاري البحث عن مواصفات الضاغط...</p>
                </div>
                <div id="compResultArea" class="mt-4 max-h-[500px] overflow-y-auto rounded-lg p-2 bg-transparent"></div>
            </div>
        `, null);
        
        calcBtn.style.display = 'none';
        
        setTimeout(() => {
            const searchBtn = document.getElementById('searchCompBtn');
            const modelInput = document.getElementById('compModelInput');
            const uploadBtn = document.getElementById('uploadImageBtn');
            const previewDiv = document.getElementById('compImagePreview');
            const resultArea = document.getElementById('compResultArea');
            const loadingIndicator = document.getElementById('compLoadingIndicator');
            
            let selectedImageFiles = [];
            
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            fileInput.multiple = true;
            fileInput.style.display = 'none';
            document.body.appendChild(fileInput);
            
            if (uploadBtn) {
                uploadBtn.onclick = () => fileInput.click();
                fileInput.onchange = (e) => {
                    const files = Array.from(e.target.files);
                    selectedImageFiles.push(...files);
                    updatePreview();
                    fileInput.value = '';
                };
            }
            
            function updatePreview() {
                if (!previewDiv) return;
                if (selectedImageFiles.length === 0) {
                    previewDiv.innerHTML = '';
                    return;
                }
                previewDiv.innerHTML = selectedImageFiles.map((file, idx) => `
                    <div class="relative inline-block">
                        <img src="${URL.createObjectURL(file)}" class="w-16 h-16 object-cover rounded border">
                        <button class="remove-img-btn absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 text-xs" data-index="${idx}">✕</button>
                    </div>
                `).join('');
                previewDiv.querySelectorAll('.remove-img-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const idx = parseInt(btn.dataset.index);
                        selectedImageFiles.splice(idx, 1);
                        updatePreview();
                    });
                });
            }
            
            async function searchCompressor() {
                const model = modelInput.value.trim();
                if (!model && selectedImageFiles.length === 0) {
                    showToast('الرجاء إدخال موديل الضاغط أو رفع صورة', 'warning');
                    return;
                }
                
                if (loadingIndicator) loadingIndicator.classList.remove('hidden');
                if (resultArea) resultArea.innerHTML = '';
                
                let prompt = `أنت خبير في ضواغط التبريد والتكييف.`;
                if (model) prompt += ` الموديل المطلوب: "${model}".`;
                else prompt += ` الموديل غير محدد، يرجى استخراج المعلومات من الصورة المرفقة إن أمكن.`;
                
                prompt += `
                أرجو منك تقديم جميع المواصفات الفنية التالية لهذا الضاغط (إذا كانت غير متوفرة، اذكر "غير معروف" مع تقديم أقرب تقدير منطقي):
                - الشركة المصنعة
                - العلامة التجارية
                - الحصان (HP) (رقم فقط)
                - القدرة بالواط (Power W)
                - نوع الفريون المناسب
                - الجهد الكهربائي
                - نوع الضاغط (مثل: Reciprocating, Scroll, Rotary)
                - الفئة المناخية
                - أمبير البدء LRA
                - أمبير التشغيل RLA
                - الإزاحة (cc/rev)
                - نوع الزيت وكميته
                - ضغط السحب النموذجي (psi)
                - ضغط الطرد النموذجي (psi)
                - ضغط التوقف (psi)
                - مكثف التشغيل (µF)
                - مكثف البدء (µF)
                - الأنبوبة الشعرية المناسبة (إن وجدت)
                - التطبيق الشائع (مثل: تكييف، تبريد، تجميد)
                - ملاحظات إضافية

                قم بتنظيم الإجابة في فقرات واضحة مع عناوين فرعية ونقاط. استخدم اللغة العربية.`;
                
                try {
                    let responseText = '';
                    if (aiManager && typeof aiManager.sendMessageStream === 'function') {
                        responseText = await new Promise((resolve, reject) => {
                            let full = '';
                            aiManager.sendMessageStream(prompt, selectedImageFiles,
                                (chunk, acc) => { full = acc; },
                                (final) => resolve(final),
                                (err) => reject(new Error(err))
                            );
                        });
                    } else if (aiManager && aiManager.sendMessage) {
                        responseText = await aiManager.sendMessage(prompt);
                    } else {
                        responseText = await fallbackGeminiCall(prompt);
                    }
                    
                    if (resultArea) {
                        resultArea.innerHTML = formatGeminiResponse(responseText, model || 'من الصورة');
                    }
                    showToast('تم العثور على معلومات الضاغط', 'success');
                    
                    if (aiManager) {
                        aiManager.addMessage('user', `بحث عن ضاغط: ${model || '(صورة)'}`);
                        aiManager.addMessage('assistant', responseText);
                    }
                    
                } catch (err) {
                    console.error(err);
                    if (resultArea) {
                        resultArea.innerHTML = `<div class="bg-red-50 border-r-4 border-red-600 p-4 rounded-lg">
                            <i class="fas fa-exclamation-triangle text-red-600 ml-2"></i>
                            <span class="font-bold">خطأ:</span> ${err.message}
                        </div>`;
                    }
                    showToast('فشل البحث، حاول مرة أخرى', 'error');
                } finally {
                    if (loadingIndicator) loadingIndicator.classList.add('hidden');
                }
            }
            
            async function fallbackGeminiCall(prompt) {
                const apiKey = state.geminiApiKey;
                const model = state.selectedGeminiModel || 'gemini-2.0-flash';
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: { temperature: 0.3, maxOutputTokens: 4000 }
                    })
                });
                if (!response.ok) {
                    const errData = await response.json().catch(()=>({}));
                    throw new Error(errData.error?.message || `HTTP ${response.status}`);
                }
                const data = await response.json();
                const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (!reply) throw new Error('رد فارغ');
                return reply;
            }
            
            if (searchBtn) searchBtn.onclick = () => searchCompressor();
            if (modelInput) {
                modelInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') searchCompressor();
                });
            }
            
            const exampleModels = ['Copeland ZR36K', 'Tecumseh AJ5512Z', 'Embraco NEK2134GK'];
            const exampleHtml = `<div class="flex gap-2 mt-2 text-xs text-gray-500">
                <span>أمثلة:</span>
                ${exampleModels.map(m => `<button class="example-model bg-gray-100 px-2 py-1 rounded hover:bg-gray-200">${m}</button>`).join('')}
            </div>`;
            const parentDiv = document.querySelector('#modalBody .space-y-4');
            if (parentDiv && !parentDiv.querySelector('.example-model')) {
                parentDiv.insertAdjacentHTML('beforeend', exampleHtml);
                document.querySelectorAll('.example-model').forEach(btn => {
                    btn.onclick = () => {
                        if (modelInput) modelInput.value = btn.innerText;
                        searchCompressor();
                    };
                });
            }
            
            modal.addEventListener('beforehide', () => {
                if (fileInput) fileInput.remove();
            }, { once: true });
            
        }, 50);
        return;
    }
    
    else if (toolId === 'ai_assistant') {
        title.innerText = 'المساعد الذكي';
        
        if (!state.geminiApiKey) {
            setContent(`
                <div class="instruction-box p-3 text-center">
                    <i class="fas fa-key text-2xl text-orange-500 mb-2"></i>
                    <p>🔑 مطلوب مفتاح Gemini API من الإعدادات الرئيسية</p>
                    <button id="goToSettingsFromAi" class="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg">⚙️ انتقل إلى الإعدادات</button>
                </div>
            `, null);
            calcBtn.style.display = 'none';
            setTimeout(() => {
                const settingsBtn = document.getElementById('goToSettingsFromAi');
                if (settingsBtn) {
                    settingsBtn.onclick = () => {
                        closeModal();
                        openMainSettings();
                    };
                }
            }, 50);
            return;
        }
        
        setContent(`<div id="aiChatContainer" style="height: 550px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #f9fafb; border-radius: 12px;">
            <div class="text-gray-500 text-center">
                <i class="fas fa-spinner fa-pulse text-2xl mb-2"></i>
                <p>جاري تحميل المساعد الذكي...</p>
            </div>
        </div>`, null);
        calcBtn.style.display = 'none';
        
        const initAISafely = () => {
            try {
                const container = document.getElementById('aiChatContainer');
                if (!container) {
                    setTimeout(initAISafely, 100);
                    return;
                }
                
                if (typeof initAIManager === 'function') {
                    initAIManager('aiChatContainer');
                } else {
                    if (!aiManager) aiManager = new AIManager();
                    aiManager.apiKey = state.geminiApiKey;
                    aiManager.selectedModel = state.selectedGeminiModel;
                    aiManager.initUI(container);
                }
                
                if (aiManager) {
                    aiManager.apiKey = state.geminiApiKey;
                    aiManager.selectedModel = state.selectedGeminiModel;
                    if (aiManager.render) aiManager.render();
                }
            } catch(err) {
                console.error('خطأ في تهيئة المساعد:', err);
                const errorContainer = document.getElementById('aiChatContainer');
                if (errorContainer) {
                    errorContainer.innerHTML = `<div class="text-red-600 text-center p-4">
                        <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
                        <p>حدث خطأ أثناء تحميل المساعد: ${err.message}</p>
                        <button onclick="location.reload()" class="mt-3 bg-blue-600 text-white px-3 py-1 rounded">إعادة تحميل الصفحة</button>
                    </div>`;
                }
                showToast('فشل تحميل المساعد الذكي', 'error');
            }
        };
        
        setTimeout(initAISafely, 150);
        return;
    }


// ========== أدوات التبريد ==========
else if (toolId === 'room') {
    title.innerText = ' حساب أحمال الغرف';
    let activeMode = window._roomActiveMode || 'normal';
    
    const roundUpHP = (hp) => {
        if (hp <= 0.5) return 0.5;
        if (hp <= 0.75) return 0.75;
        if (hp <= 1) return 1;
        if (hp <= 1.5) return 1.5;
        if (hp <= 2) return 2;
        if (hp <= 2.5) return 2.5;
        if (hp <= 3) return 3;
        if (hp <= 4) return 4;
        if (hp <= 5) return 5;
        return Math.ceil(hp);
    };
    
    const calculateNormal = () => {
        const l = parseFloat(document.getElementById('r_l')?.value);
        const w = parseFloat(document.getElementById('r_w')?.value);
        const h = parseFloat(document.getElementById('r_h')?.value);
        const factorVal = parseFloat(document.getElementById('r_factor')?.value);
        if (isNaN(l) || isNaN(w) || isNaN(h) || l <= 0 || w <= 0 || h <= 0) {
            showToast('أدخل أبعاداً موجبة', 'warning');
            return;
        }
        const volume = l * w * h;
        const btu = volume * factorVal;
        const hp = btu / 8000;
        const ton = btu / 12000;
        const watt = hp * 745.6;
        const amp = watt / 220;
        const hpRec = roundUpHP(hp);
        const tonRec = (hpRec * 8000) / 12000;
        const wattRec = hpRec * 745.6;
        const ampRec = wattRec / 220;
        
        showFullRes('نتيجة حمل التكييف العادي', {
            ' تحذير': 'هذه الحسابات تقريبية وقد تختلف في الواقع العملي ',
            'الأبعاد': `${l} x  ${w} x ${h} m`,
            'الحجم (م³)': volume.toFixed(1),
            'المعامل الحراري': factorVal + ' btu/m³',
            'الحمل الحراري (BTU/h)': btu.toFixed(0),
            'الحصان الفعلي (HP)': hp.toFixed(2),
            'طن التبريد (Ton)': ton.toFixed(2),
            'القدرة (واط)': watt.toFixed(0),
            'التيار (أمبير)': amp.toFixed(2),
            'الحصان الموصى به': hpRec,
            'الطن الموصى به': tonRec.toFixed(2),
            'القدرة الموصى بها (واط)': wattRec.toFixed(0),
            'التيار الموصى به (أمبير)': ampRec.toFixed(2)
        });
    };
    
    const calculateAdvanced = async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
        const l = parseFloat(document.getElementById('adv_l')?.value);
        const w = parseFloat(document.getElementById('adv_w')?.value);
        const h = parseFloat(document.getElementById('adv_h')?.value);
        const roomType = document.getElementById('adv_room_type')?.value;
        const insulationU = parseFloat(document.getElementById('insulation')?.value);
        const people = parseInt(document.getElementById('people_count')?.value) || 0;
        const lightingW = parseFloat(document.getElementById('lighting_watt')?.value) || 0;
        const equipmentW = parseFloat(document.getElementById('equipment_watt')?.value) || 0;
        const outsideTemp = parseFloat(document.getElementById('outside_temp')?.value) || 35;
        const ach = parseFloat(document.getElementById('infiltration_ach')?.value) || 0.5;
        
        if (isNaN(l) || isNaN(w) || isNaN(h) || l <= 0 || w <= 0 || h <= 0) {
            showToast('أدخل أبعاداً موجبة', 'warning');
            return;
        }
        
        const volume = l * w * h;
        const surfaceArea = 2 * (l*w + l*h + w*h);
        let insideTemp = 24;
        if (roomType === 'cooler') insideTemp = 2;
        else if (roomType === 'freezer') insideTemp = -20;
        
        const wallLoad = surfaceArea * insulationU * (outsideTemp - insideTemp);
        const peopleLoad = people * (roomType === 'ac' ? 150 : 250);
        const lightLoad = lightingW;
        const equipLoad = equipmentW;
        const infiltrationLoad = 1.2 * ach * volume * (outsideTemp - insideTemp);
        
        let productLoad = 0;
        if (roomType !== 'ac') {
            const weight = parseFloat(document.getElementById('product_weight')?.value);
            const productType = document.getElementById('product_type')?.value;
            const entryTemp = parseFloat(document.getElementById('product_entry_temp')?.value);
            const coolTime = parseFloat(document.getElementById('cooling_time')?.value);
            if (!isNaN(weight) && weight > 0 && !isNaN(coolTime) && coolTime > 0) {
                let cp, latentHeat = 0;
                if (productType === 'veg') cp = 3.6;
                else if (productType === 'meat') { cp = 3.2; latentHeat = 210; }
                else if (productType === 'dairy') cp = 3.8;
                else cp = 3.5;
                const sensible = weight * cp * (entryTemp - insideTemp);
                let latent = 0;
                if (roomType === 'freezer' && latentHeat > 0 && insideTemp < 0) latent = weight * latentHeat;
                productLoad = ((sensible + latent) / coolTime) * (1000 / 3600);
            }
        }
        
        let totalWatts = wallLoad + peopleLoad + lightLoad + equipLoad + productLoad + infiltrationLoad;
        totalWatts *= 1.15;
        
        const btu = totalWatts * 3.412;
        const hp = btu / 8000;
        const ton = btu / 12000;
        const amp = totalWatts / 220;
        const hpRec = roundUpHP(hp);
        const tonRec = (hpRec * 8000) / 12000;
        const wattRec = hpRec * 745.6;
        const ampRec = wattRec / 220;
        
        showFullRes('نتيجة الحمل المتقدم', {
            ' تحذير': 'هذه الحسابات تقريبية وقد تختلف في الواقع العملي',
            'نوع الغرفة': roomType === 'ac' ? 'تكييف عادي' : (roomType === 'cooler' ? 'غرفة تبريد (2°C)' : 'غرفة تجميد (-20°C)'),
            'الأبعاد': `${l} x ${w} x ${h} م`,
            'الحجم (م³)': volume.toFixed(1),
            'مساحة الأسطح (م²)': surfaceArea.toFixed(1),
            'حمولة الجدران (واط)': wallLoad.toFixed(0),
            'حمولة الأشخاص (واط)': peopleLoad.toFixed(0),
            'الإضاءة (واط)': lightLoad.toFixed(0),
            'الأجهزة (واط)': equipLoad.toFixed(0),
            'حمولة البضائع (واط)': productLoad.toFixed(0),
            ' تسريب الهواء (واط)': infiltrationLoad.toFixed(0),
            'الإجمالي قبل الاحتياطي (واط)': (totalWatts / 1.15).toFixed(0),
            'الإجمالي بعد الاحتياطي (واط)': totalWatts.toFixed(0),
            'الإجمالي (BTU/h)': btu.toFixed(0),
            'الحصان الفعلي (HP)': hp.toFixed(2),
            'التيار (أمبير)': amp.toFixed(2),
            'الحصان الموصى به (تقريب 0.5)': hpRec,
            'الطن الموصى به': tonRec.toFixed(2),
            'القدرة الموصى بها (واط)': wattRec.toFixed(0),
            'التيار الموصى به (أمبير)': ampRec.toFixed(2),
            'ملاحظة': 'تم إضافة 15% احتياطي للتهوية وفتح الأبواب، وحمل تسريب الهواء حسب ACH المختار'
        });
    };
    
    const performCalculation = async () => {
        if (activeMode === 'normal') {
            calculateNormal();
        } else {
            await calculateAdvanced();
        }
    };
    
    const renderContent = () => {
        const html = `
            <div class="p-3">
                <div class="flex gap-2 mb-4 border-b pb-2">
                    <button id="tabNormal" class="tab-btn ${activeMode === 'normal' ? 'active' : ''}" style="flex:1; padding:8px 0;">تكييف عادي</button>
                    <button id="tabAdvanced" class="tab-btn ${activeMode === 'advanced' ? 'active' : ''}" style="flex:1; padding:8px 0;"> حمل متقدم</button>
                </div>
                <div id="roomContent">
                    ${activeMode === 'normal' ? `
                        <div class="space-y-3">
                            <div class="instruction-box p-2 text-sm"> حسب الأبعاد والمعامل الحراري فقط</div>
                            <div><label class="block text-sm font-bold mb-1">الطول (م)</label><input type="number" step="any" id="r_l" value="5"></div>
                            <div><label class="block text-sm font-bold mb-1">العرض (م)</label><input type="number" step="any" id="r_w" value="4"></div>
                            <div><label class="block text-sm font-bold mb-1">الارتفاع (م)</label><input type="number" step="any" id="r_h" value="3"></div>
                            <div><label class="block text-sm font-bold mb-1">المعامل الحراري (btu/m³)</label>
                                <select id="r_factor">
                                    <option value="250">عادي - 250</option>
                                    <option value="300" selected>مشمس - 300</option>
                                    <option value="350">مطبخ - 350</option>
                                    <option value="400">حمل عالي - 400</option>
                                </select>
                            </div>
                        </div>
                    ` : `
                        <div class="space-y-3">
                            <div class="instruction-box p-2 text-sm"> يشمل العزل، الأشخاص، الإضاءة، الأجهزة، البضائع، وتسريب الهواء (ACH)</div>
                            <div><label class="block text-sm font-bold mb-1">الطول (م)</label><input type="number" step="any" id="adv_l" value="6"></div>
                            <div><label class="block text-sm font-bold mb-1">العرض (م)</label><input type="number" step="any" id="adv_w" value="5"></div>
                            <div><label class="block text-sm font-bold mb-1">الارتفاع (م)</label><input type="number" step="any" id="adv_h" value="3"></div>
                            <div><label class="block text-sm font-bold mb-1">نوع الغرفة</label>
                                <select id="adv_room_type">
                                    <option value="ac">تكييف عادي (تبريد بشري)</option>
                                    <option value="cooler">غرفة تبريد (0°C إلى 4°C)</option>
                                    <option value="freezer">غرفة تجميد (-18°C إلى -25°C)</option>
                                </select>
                            </div>
                            <div id="productLoadDiv" style="display:none;" class="border p-3 rounded-lg bg-gray-50 space-y-2">
                                <div class="font-bold text-sm">حمل البضائع</div>
                                <div><label class="block text-xs">الوزن (كجم)</label><input type="number" step="any" id="product_weight" placeholder="الوزن"></div>
                                <div><label class="block text-xs">نوع المنتج</label>
                                    <select id="product_type">
                                        <option value="veg">خضروات/فواكه</option>
                                        <option value="meat" selected>لحوم</option>
                                        <option value="dairy">ألبان</option>
                                        <option value="general">عام</option>
                                    </select>
                                </div>
                                <div><label class="block text-xs">حرارة دخول المنتج (°C)</label><input type="number" step="any" id="product_entry_temp" value="25"></div>
                                <div><label class="block text-xs">زمن التبريد (ساعات)</label><input type="number" step="any" id="cooling_time" value="12"></div>
                            </div>
                            <div><label class="block text-sm font-bold mb-1"> العزل الحراري (U واط/م²·ك)</label>
                                <select id="insulation">
                                    <option value="0.5">ممتاز (U=0.5)</option>
                                    <option value="0.8">جيد (U=0.8)</option>
                                    <option value="1.2" selected>متوسط (U=1.2)</option>
                                    <option value="2.0">ضعيف (U=2.0)</option>
                                </select>
                            </div>
                            <div><label class="block text-sm font-bold mb-1"> تسريب الهواء (ACH)</label>
                                <select id="infiltration_ach">
                                    <option value="0.3">غرفة مغلقة جيدًا (0.3)</option>
                                    <option value="0.5" selected>غرفة عادية (0.5)</option>
                                    <option value="0.7">مكتب / منزل (0.7)</option>
                                    <option value="1.0">مطبخ / محل (1.0)</option>
                                    <option value="2.0">باب يفتح كثيرًا (2.0)</option>
                                    <option value="3.0">غرفة تبريد / تجميد (3.0)</option>
                                </select>
                            </div>
                            <div><label class="block text-sm font-bold mb-1"> عدد الأشخاص</label><input type="number" id="people_count" value="2"></div>
                            <div><label class="block text-sm font-bold mb-1"> الإضاءة (واط)</label><input type="number" step="any" id="lighting_watt" value="200"></div>
                            <div><label class="block text-sm font-bold mb-1">الأجهزة الكهربائية (واط)</label><input type="number" step="any" id="equipment_watt" value="500"></div>
                            <div><label class="block text-sm font-bold mb-1"> درجة حرارة الخارج (°C)</label><input type="number" step="any" id="outside_temp" value="35"></div>
                        </div>
                    `}
                </div>
            </div>
        `;
        
        setContent(html, null);
        
        setTimeout(() => {
            const tabNormal = document.getElementById('tabNormal');
            const tabAdvanced = document.getElementById('tabAdvanced');
            if (tabNormal) {
                tabNormal.onclick = () => {
                    window._roomActiveMode = 'normal';
                    activeMode = 'normal';
                    renderContent();
                };
            }
            if (tabAdvanced) {
                tabAdvanced.onclick = () => {
                    window._roomActiveMode = 'advanced';
                    activeMode = 'advanced';
                    renderContent();
                };
            }
            
            const roomSelect = document.getElementById('adv_room_type');
            const toggleProduct = () => {
                const div = document.getElementById('productLoadDiv');
                if (div && roomSelect) {
                    div.style.display = (roomSelect.value === 'cooler' || roomSelect.value === 'freezer') ? 'block' : 'none';
                    clearResult();
                }
            };
            if (roomSelect) {
                roomSelect.onchange = toggleProduct;
                toggleProduct();
            }
            
            bindClearResultOnChange(document.getElementById('modalBody'));
        }, 20);
        
        const calcButton = document.getElementById('calculateBtn');
        if (calcButton) {
            calcButton.style.display = 'flex';
            calcButton.onclick = () => withLoading(calcButton, performCalculation);
        }
    };
    
    renderContent();
    return;
}

else if (toolId === 'capillary') {
    title.innerText = ' حساب الكابلري (الأنبوب الشعري) ';
    
    const capillarySizes = TOOL_CONSTANTS.capillarySizes;
    
    function advancedCapillary(capacityWatts, refrigerant, evapTemp, condTemp, subcooling, superheat, liquidLineLen, segments = 30) {
        const props = TOOL_CONSTANTS.refrigerantPropsGlobal[refrigerant];
        if (!props) return null;
        
        let deltaP_total = getPressureFromTemp(refrigerant, condTemp) - getPressureFromTemp(refrigerant, evapTemp);
        deltaP_total = Math.max(deltaP_total - (0.5 + liquidLineLen * 0.03), 0.8);
        if (deltaP_total < 0.8) return null;
        
        let h_liq = 200000 - subcooling * 2000;
        let h_vap = 400000 + superheat * 2000;
        let delta_h = Math.max(h_vap - h_liq, 50000);
        let massFlow = capacityWatts / delta_h;
        if (massFlow <= 0) massFlow = 0.003;
        
        let candidates = [];
        for (let diam of capillarySizes.map(s => s.inch)) {
            const d_m = diam * 0.0254;
            const area = Math.PI * d_m * d_m / 4;
            let rhoL_entry = getDensityFromTemp(refrigerant, condTemp - subcooling, 'liquid');
            let vel = massFlow / (rhoL_entry * area);
            
            let P_entry = getPressureFromTemp(refrigerant, condTemp) - (0.3 + liquidLineLen * 0.02);
            let P_exit = getPressureFromTemp(refrigerant, evapTemp);
            let criticalVelocity = Math.sqrt(2 * (P_entry - P_exit) * 1e5 / rhoL_entry);
            if (vel > criticalVelocity) vel = criticalVelocity;
            
            let Re = (rhoL_entry * vel * d_m) / props.viscosity_liq;
            let f = (Re < 2000) ? (64 / Re) : (0.316 / Math.pow(Re, 0.25));
            
            let deltaP_seg = (P_entry - P_exit) / segments;
            let totalLength = 0;
            let P_current = P_entry;
            
            for (let i = 0; i < segments; i++) {
                let P_next = Math.max(P_current - deltaP_seg, P_exit);
                let x = i/segments;
                x = Math.min(Math.max(x, 0), 0.98);
                
                let rhoL_avg = getDensityFromTemp(refrigerant, condTemp - subcooling + (i/segments)*10, 'liquid');
                let rhoG_avg = getDensityFromTemp(refrigerant, evapTemp + superheat + (i/segments)*5, 'vapor');
                let rho_mix = 1 / ((1-x)/rhoL_avg + x/rhoG_avg);
                let mu_mix = props.viscosity_liq * (1 - x) + props.viscosity_vapor * x;
                let vel_mix = massFlow / (rho_mix * area);
                let Re_mix = (rho_mix * vel_mix * d_m) / mu_mix;
                
                let f_mix;
                if (Re_mix < 2000) f_mix = 64 / Re_mix;
                else f_mix = 0.316 / Math.pow(Re_mix, 0.25);
                
                let Xtt = Math.pow((1-x)/Math.max(x,0.001), 0.9) * Math.pow(rhoG_avg/rhoL_avg, 0.5) * Math.pow(props.viscosity_liq/props.viscosity_vapor, 0.1);
                let C = (Re_mix < 2000) ? 5 : 20;
                let phiL2 = 1 + C/Xtt + 1/(Xtt*Xtt);
                
                let dpdz_fric = f_mix * (1/d_m) * 0.5 * rho_mix * vel_mix * vel_mix * phiL2;
                let dpdz_acc = massFlow * massFlow * (1/rhoG_avg - 1/rhoL_avg) / d_m;
                let dpdz = Math.max(dpdz_fric + dpdz_acc, 1);
                
                let dz = deltaP_seg * 1e5 / dpdz;
                totalLength += dz;
                
                P_current = P_next;
                if (P_current <= P_exit) break;
            }
            totalLength = Math.max(totalLength, 0.2);
            candidates.push({ diameter: diam, length: totalLength, massFlow, deltaP: P_entry - P_exit, Re });
        }
        
        let best = null;
        let bestScore = Infinity;
        for (let cand of candidates) {
            const d_m = cand.diameter * 0.0254;
            const area = Math.PI * d_m * d_m / 4;
            const rhoL = getDensityFromTemp(refrigerant, condTemp - subcooling, 'liquid');
            const velocity = cand.massFlow / (rhoL * area);
            let velBonus = 0;
            if (velocity >= 0.5 && velocity <= 3.0) velBonus = -50;
            else velBonus = Math.abs(velocity - 1.5) * 20;
            let lengthScore = 0;
            if (cand.length >= 1 && cand.length <= 3) lengthScore = Math.abs(cand.length - 2);
            else if (cand.length < 1) lengthScore = 100 + (1 - cand.length);
            else lengthScore = 50 + (cand.length - 3);
            let score = lengthScore + velBonus;
            if (score < bestScore) {
                bestScore = score;
                best = cand;
            }
        }
        return best;
    }
    
    const refrigerantPropsQuick = {
        'R22':   { density:1190, viscosity:0.00023, h_liquid:200, h_vapor:400 },
        'R410A': { density:1090, viscosity:0.00022, h_liquid:220, h_vapor:480 },
        'R134a': { density:1207, viscosity:0.00028, h_liquid:180, h_vapor:397 },
        'R404A': { density:1040, viscosity:0.00024, h_liquid:190, h_vapor:390 },
        'R407C': { density:1130, viscosity:0.00025, h_liquid:210, h_vapor:460 },
        'R32':   { density:960,  viscosity:0.00020, h_liquid:240, h_vapor:560 },
        'R290':  { density:500,  viscosity:0.00012, h_liquid:280, h_vapor:705 },
        'R600a': { density:550,  viscosity:0.00018, h_liquid:260, h_vapor:620 }
    };
    
    function quickMode(capacityWatts, refrigerant, evapTemp, condTemp, subcooling, superheat, liquidLineLen) {
        const props = refrigerantPropsQuick[refrigerant];
        if (!props) return null;
        
        let deltaP_bar = getPressureFromTemp(refrigerant, condTemp) - getPressureFromTemp(refrigerant, evapTemp);
        deltaP_bar = Math.max(deltaP_bar - (0.5 + liquidLineLen*0.02), 0.8);
        
        let hL = props.h_liquid*1000 - subcooling*2000;
        let hV = props.h_vapor*1000 + superheat*2000;
        let delta_h = Math.max(hV - hL, 50000);
        let massFlow = capacityWatts / delta_h;
        if (massFlow <= 0) massFlow = 0.003;
        
        let bestDiameter = capillarySizes[4].inch;
        let bestVelocity = Infinity;
        for (let s of capillarySizes) {
            const d_m = s.inch * 0.0254;
            const area = Math.PI * d_m * d_m / 4;
            const vel = massFlow / (props.density * area);
            if (vel >= 0.5 && vel <= 3.0 && Math.abs(vel - 1.5) < bestVelocity) {
                bestVelocity = Math.abs(vel - 1.5);
                bestDiameter = s.inch;
            }
        }
        
        const diameter = bestDiameter;
        const d_m = diameter * 0.0254;
        const area = Math.PI * d_m * d_m / 4;
        const velocity = massFlow / (props.density * area);
        const Re = (props.density * velocity * d_m) / props.viscosity;
        const f = (Re < 2000) ? (64 / Re) : (0.316 / Math.pow(Re, 0.25));
        let L = (deltaP_bar * 1e5 * d_m) / (f * 0.5 * props.density * velocity * velocity);
        let twoPhaseFactor = Math.min(Math.max(0.7 + superheat*0.015, 0.65), 0.95);
        L = Math.max(L * twoPhaseFactor, 0.3);
        
        return { diameter, length: L, massFlow, deltaP: deltaP_bar, Re };
    }
    
    const calculateCapillary = () => {
        try {
            const refrigerant = document.getElementById('cap_ref')?.value;
            let powerValue = parseFloat(document.getElementById('cap_power')?.value);
            const powerUnit = document.getElementById('cap_power_unit')?.value;
            let evapTemp = parseFloat(document.getElementById('cap_evap_temp')?.value);
            let condTemp = parseFloat(document.getElementById('cap_cond_temp')?.value);
            let subcooling = parseFloat(document.getElementById('cap_subcooling')?.value) || 5;
            let superheat = parseFloat(document.getElementById('cap_superheat')?.value) || 8;
            let liquidLineLen = parseFloat(document.getElementById('cap_liquid_line')?.value) || 0;
            let mode = document.getElementById('cap_mode')?.value === 'advanced' ? 'advanced' : 'quick';
            
            if (!refrigerant || isNaN(powerValue) || isNaN(evapTemp) || isNaN(condTemp)) {
                showToast('يرجى إدخال جميع القيم بشكل صحيح', 'warning');
                return;
            }
            
            const power = convertPower(powerValue, powerUnit);
            if (power.watt <= 0) {
                showToast('القدرة يجب أن تكون أكبر من صفر', 'warning');
                return;
            }
            
            let result;
            if (mode === 'advanced') {
                result = advancedCapillary(power.watt, refrigerant, evapTemp, condTemp, subcooling, superheat, liquidLineLen, 30);
                if (!result) {
                    showToast('فشل الحساب المتقدم (فرق ضغط منخفض جداً)، جرّب الوضع السريع', 'error');
                    return;
                }
            } else {
                result = quickMode(power.watt, refrigerant, evapTemp, condTemp, subcooling, superheat, liquidLineLen);
            }
            
            if (!result) return;
            
            let deltaP_psi = (result.deltaP || 0) * 14.5038;
            let suggestions = [];
            if (result.length > 5) suggestions.push(` الطول الناتج (${result.length.toFixed(2)} م) طويل جداً → استخدم قطر أكبر أو زد Subcooling.`);
            else if (result.length > 3.5) suggestions.push(`الطول (${result.length.toFixed(2)} م) طويل نسبياً. يمكن استخدام قطر أكبر قليلاً.`);
            if (result.length < 0.7) suggestions.push(` الطول (${result.length.toFixed(2)} م) قصير جداً → استخدم قطر أصغر أو أنقص Subcooling.`);
            else if (result.length < 0.8) suggestions.push(`الطول قصير (${result.length.toFixed(2)} م)، قد يكون القطر كبيراً.`);
            if (deltaP_psi < 50) suggestions.push(` فرق الضغط منخفض (${deltaP_psi.toFixed(1)} psi) → قد لا يعمل الكابلري بكفاءة.`);
            if (result.massFlow > 0.035) suggestions.push(` معدل التدفق مرتفع جداً (${(result.massFlow*1000).toFixed(0)} جم/ث) → يفضل صمام تمدد بدلاً من الكابلري.`);
            if (result.Re < 1000) suggestions.push(` جريان طبقي (Re=${result.Re}) → أداء الكابلري ضعيف، غيّر القطر أو زد التدفق.`);
            if (suggestions.length === 0) suggestions.push(' الأبعاد مناسبة للتشغيل العادي');
            
            const d_m = result.diameter * 0.0254;
            const area = Math.PI * d_m * d_m / 4;
            const rhoL = getDensityFromTemp(refrigerant, condTemp - subcooling, 'liquid');
            const velocity = result.massFlow / (rhoL * area);
            suggestions.push(` سرعة السائل: ${velocity.toFixed(2)} م/ث ${(velocity>=0.5 && velocity<=3) ? '(مناسبة)' : '(يفضل ضبطها بين 0.5-3 م/ث)'}`);
            
            const resultObj = {
                ' الوضع': mode === 'advanced' ? 'دقيق (متعدد الشرائح)' : 'سريع (تقديري)',
                'الفريون': refrigerant,
                'القدرة': `${powerValue} ${powerUnit === 'btu' ? 'BTU/h' : (powerUnit === 'watt' ? 'واط' : 'HP')}`,
                'درجات الحرارة': `تبخير ${evapTemp}°C / تكثيف ${condTemp}°C`,
                'فرق الضغط الفعلي': `${(result.deltaP || 0).toFixed(2)} بار  (${deltaP_psi.toFixed(1)} psi)`,
                ' القطر الموصى به (بوصة)': result.diameter.toFixed(5),
                'الطول التقريبي (متر)': result.length.toFixed(2),
                'معدل التدفق (كجم/ث)': result.massFlow.toFixed(5),
                'رقم رينولدز': Math.round(result.Re || 0),
                'توصيات': suggestions.join(' | ')
            };
            showFullRes(' نتيجة حساب الكابلري ', resultObj);
        } catch(err) {
            console.error(err);
            showToast('خطأ في الحساب: ' + err.message, 'error');
        }
    };
    
    let refrigerantOptions = Object.keys(TOOL_CONSTANTS.refrigerantPropsGlobal).map(r => `<option value="${r}">${r}</option>`).join('');
    
    setContent(`
        <div class="grid gap-3" dir="rtl" style="display: flex; flex-direction: column; gap: 1rem;">
            <div><label class="block mb-1 text-sm font-semibold">نوع الفريون</label>
            <select id="cap_ref">${refrigerantOptions}</select></div>
            
            <div><label class="block mb-1 text-sm font-semibold">وضع الحساب</label>
            <select id="cap_mode"><option value="quick">سريع (تقديري)</option><option value="advanced" selected>دقيق (متقدم)</option></select></div>
            
            <div><label class="block mb-1 text-sm font-semibold">القدرة</label>
            <div style="display: flex; gap: 0.5rem;"><input type="number" step="any" id="cap_power" value="12000">
            <select id="cap_power_unit"><option value="btu">BTU/h</option><option value="watt">واط</option><option value="hp">HP</option></select></div></div>
            
            <div><label class="block mb-1 text-sm font-semibold">حرارة التبخير (°C)</label>
            <input type="number" step="any" id="cap_evap_temp" value="5"></div>
            
            <div><label class="block mb-1 text-sm font-semibold">حرارة التكثيف (°C)</label>
            <input type="number" step="any" id="cap_cond_temp" value="45"></div>
            
            <div><label class="block mb-1 text-sm font-semibold">Subcooling (°C)</label>
            <input type="number" step="any" id="cap_subcooling" value="5"></div>
            
            <div><label class="block mb-1 text-sm font-semibold">Superheat (°C)</label>
            <input type="number" step="any" id="cap_superheat" value="8"></div>
            
            <div><label class="block mb-1 text-sm font-semibold">طول خط السائل (م)</label>
            <input type="number" step="any" id="cap_liquid_line" value="1"></div>
        </div>
    `);
    
    const existingBtn = document.getElementById('calculateBtn');
    if (existingBtn) {
        const newBtn = existingBtn.cloneNode(true);
        existingBtn.parentNode.replaceChild(newBtn, existingBtn);
        newBtn.onclick = (e) => {
            e.preventDefault();
            calculateCapillary();
        };
        newBtn.disabled = false;
        newBtn.innerText = ' حساب';
    } else {
        const observer = new MutationObserver(() => {
            const btn = document.getElementById('calculateBtn');
            if (btn) {
                btn.onclick = (e) => {
                    e.preventDefault();
                    calculateCapillary();
                };
                btn.disabled = false;
                btn.innerText = ' حساب';
                observer.disconnect();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
        setTimeout(() => observer.disconnect(), 2000);
    }
    
    const bindInputs = () => {
        const inputs = ['cap_ref', 'cap_power', 'cap_power_unit', 'cap_evap_temp', 'cap_cond_temp', 'cap_subcooling', 'cap_superheat', 'cap_liquid_line', 'cap_mode'];
        inputs.forEach(id => {
            const el = document.getElementById(id);
            if (el && !el.hasAttribute('data-cap-listener')) {
                el.addEventListener('input', () => clearResult());
                el.setAttribute('data-cap-listener', 'true');
            }
        });
    };
    bindInputs();
    setTimeout(bindInputs, 100);
    return;
}

else if (toolId === 'evap_cond') {
    title.innerText = ' تصميم المبخر والمكثف';
    
    const appData = TOOL_CONSTANTS.appData;
    const refrigerantProps = TOOL_CONSTANTS.refrigerantPropsGlobal;
    const finTypes = TOOL_CONSTANTS.finTypes;
    const coilTypes = TOOL_CONSTANTS.coilTypes;
    
    const diameterOptions = [0.25, 0.3125, 0.375, 0.5, 0.625, 0.75, 0.875, 1.0];
    const diamLabels = {0.25:'1/4"', 0.3125:'5/16"', 0.375:'3/8"', 0.5:'1/2"', 0.625:'5/8"', 0.75:'3/4"', 0.875:'7/8"', 1.0:'1"'};
    
    function advancedDesign(power_watt, appKey, refrigerant, evapTemp, condTemp, airVelocity, finTypeKey, d_evap_in, d_cond_in, humidity, coilTypeKey) {
        const app = appData[appKey];
        const refData = refrigerantProps[refrigerant];
        const fin = finTypes[finTypeKey] || finTypes['زعانف عادية (20 فِن/بوصة)'];
        const coilFactor = coilTypes[coilTypeKey]?.factor || 1.0;
        if (!app || !refData) return null;
        
        const dynamicCOP = estimateCOP(evapTemp, condTemp, appKey);
        const Q_evap = power_watt;
        const Q_cond = Q_evap * (1 + 1/dynamicCOP);
        
        let deltaT_air_evap = (appKey === 'ac' ? 10 : (appKey === 'cooler' ? 5 : 4));
        let t_air_out_evap = app.t_air_in_evap - deltaT_air_evap;
        let deltaT_air_cond = (appKey === 'ac' ? 12 : (appKey === 'cooler' ? 8 : 6));
        let t_air_out_cond = app.t_air_in_cond + deltaT_air_cond;
        
        let LMTD_evap_val = LMTD_evap(app.t_air_in_evap, t_air_out_evap, evapTemp);
        let LMTD_cond_val = LMTD_cond(condTemp, app.t_air_in_cond, t_air_out_cond);
        
        let h_air_evap = h_air_from_velocity(airVelocity, 'evap', fin.blockage_factor);
        let h_air_cond = h_air_from_velocity(airVelocity, 'cond', fin.blockage_factor);
        let h_ref_evap = h_ref_coeff('evap', refrigerant);
        let h_ref_cond = h_ref_coeff('cond', refrigerant);
        
        let d_evap_m = d_evap_in * 0.0254;
        let d_cond_m = d_cond_in * 0.0254;
        
        let U_evap = calculate_U(h_air_evap, h_ref_evap, fin.eta, fin.area_mult, d_evap_m, coilFactor);
        let U_cond = calculate_U(h_air_cond, h_ref_cond, fin.eta, fin.area_mult, d_cond_m, coilFactor);
        
        let A_evap_req = Q_evap / (U_evap * LMTD_evap_val);
        let A_cond_req = Q_cond / (U_cond * LMTD_cond_val);
        
        let A_tube_evap = A_evap_req / fin.area_mult;
        let A_tube_cond = A_cond_req / fin.area_mult;
        
        let lengthEvap = A_tube_evap / (Math.PI * d_evap_m) * 1.10;
        let lengthCond = A_tube_cond / (Math.PI * d_cond_m) * 1.10;
        
        const superheat = 5;
        const subcool = 5;
        let correction = 1 + (superheat * 0.01) - (subcool * 0.005);
        let m_dot_ref = (Q_evap / refData.h_evap) * correction;
        
        let A_cross_evap = Math.PI * d_evap_m * d_evap_m / 4;
        let A_cross_cond = Math.PI * d_cond_m * d_cond_m / 4;
        
        let vel_ref_evap = m_dot_ref / (refData.density_vapor * A_cross_evap);
        const density_mix = 0.7 * refData.density_liq + 0.3 * refData.density_vapor;
        let vel_ref_cond = m_dot_ref / (density_mix * A_cross_cond);
        
        vel_ref_evap = Math.min(vel_ref_evap, 10);
        vel_ref_cond = Math.min(vel_ref_cond, 10);
        
        let dp_evap_psi = pressureDropPsi(lengthEvap, vel_ref_evap, d_evap_in, refData.density_vapor, refData.viscosity_vapor || 0.000012);
        let dp_cond_psi = pressureDropPsi(lengthCond, vel_ref_cond, d_cond_in, density_mix, refData.viscosity_liq);
        
        let cfm_evap = airflow_cfm_from_load(Q_evap, app.t_air_in_evap, t_air_out_evap, humidity);
        let cfm_cond = airflow_cfm_from_load(Q_cond, app.t_air_in_cond, t_air_out_cond, humidity);
        
        let face_area_evap_m2 = (cfm_evap / 2118.88) / airVelocity;
        let face_area_cond_m2 = (cfm_cond / 2118.88) / airVelocity;
        
        let width_evap = Math.sqrt(face_area_evap_m2 * 1.5);
        let height_evap = face_area_evap_m2 / width_evap;
        let width_cond = Math.sqrt(face_area_cond_m2 * 1.5);
        let height_cond = face_area_cond_m2 / width_cond;
        
        let realFaceVelEvap = cfm_evap / (face_area_evap_m2 * 2118.88);
        let realFaceVelCond = cfm_cond / (face_area_cond_m2 * 2118.88);
        
        const pitch = 0.03;
        let numberOfRowsEvap = Math.max(1, Math.floor(height_evap / pitch));
        let numberOfRowsCond = Math.max(1, Math.floor(height_cond / pitch));
        
        const bend_factor = 1.1;
        let turnsEvap = (lengthEvap / (width_evap * numberOfRowsEvap)) / bend_factor;
        let turnsCond = (lengthCond / (width_cond * numberOfRowsCond)) / bend_factor;
        turnsEvap = Math.min(Math.max(turnsEvap, 2), 30);
        turnsCond = Math.min(Math.max(turnsCond, 2), 30);
        
        let warnings = [];
        if (LMTD_evap_val < 5) warnings.push(' LMTD المبخر منخفض جداً (<5)');
        if (LMTD_cond_val < 5) warnings.push(' LMTD المكثف منخفض جداً');
        if (vel_ref_evap < 2) warnings.push('سرعة فريون (بخار) منخفضة - خطر عدم رجوع الزيت');
        if (vel_ref_evap > 8) warnings.push('سرعة فريون عالية - فقد ضغط وتآكل');
        if (airVelocity < 1.2) warnings.push(' سرعة هواء منخفضة جداً');
        if (airVelocity > 5) warnings.push(' سرعة هواء عالية جداً');
        if (U_evap < 20) warnings.push(' انتقال حراري ضعيف في المبخر (U منخفض)');
        if (U_cond < 40) warnings.push(' انتقال حراري ضعيف في المكثف (U منخفض)');
        if (dp_evap_psi > 5) warnings.push(` فقد ضغط المبخر عالي (${dp_evap_psi.toFixed(2)} psi)`);
        if (dp_cond_psi > 5) warnings.push(` فقد ضغط المكثف عالي (${dp_cond_psi.toFixed(2)} psi)`);
        
        const warningText = warnings.length ? warnings.join(' | ') : ' جميع القيم ضمن النطاق المنطقي';
        
        return {
            mode: 'متقدم (LMTD + U حقيقي + COP ديناميكي + فقد ضغط)',
            app_name: app.name,
            refrigerant,
            Q_evap_kW: (Q_evap/1000).toFixed(2),
            Q_cond_kW: (Q_cond/1000).toFixed(2),
            COP: dynamicCOP.toFixed(2),
            evap: {
                temp_evap: evapTemp,
                t_air_in: app.t_air_in_evap,
                t_air_out: t_air_out_evap.toFixed(1),
                LMTD: LMTD_evap_val.toFixed(1),
                U: U_evap.toFixed(0),
                length_m: lengthEvap.toFixed(2),
                diameter_inch: d_evap_in,
                ref_velocity_mps: vel_ref_evap.toFixed(2),
                pressure_drop_psi: dp_evap_psi.toFixed(2),
                airflow_cfm: Math.round(cfm_evap),
                face_width_cm: (width_evap*100).toFixed(0),
                face_height_cm: (height_evap*100).toFixed(0),
                face_velocity_mps: realFaceVelEvap.toFixed(2),
                turns: Math.round(turnsEvap)
            },
            cond: {
                temp_cond: condTemp,
                t_air_in: app.t_air_in_cond,
                t_air_out: t_air_out_cond.toFixed(1),
                LMTD: LMTD_cond_val.toFixed(1),
                U: U_cond.toFixed(0),
                length_m: lengthCond.toFixed(2),
                diameter_inch: d_cond_in,
                ref_velocity_mps: vel_ref_cond.toFixed(2),
                pressure_drop_psi: dp_cond_psi.toFixed(2),
                airflow_cfm: Math.round(cfm_cond),
                face_width_cm: (width_cond*100).toFixed(0),
                face_height_cm: (height_cond*100).toFixed(0),
                face_velocity_mps: realFaceVelCond.toFixed(2),
                turns: Math.round(turnsCond)
            },
            fin_type: finTypeKey,
            air_velocity: airVelocity,
            humidity: (humidity * 100).toFixed(0) + '%',
            coil_type: coilTypes[coilTypeKey]?.name || 'مصفوفة',
            warnings: warningText
        };
    }
    
    function quickDesign(power_watt, appKey, refrigerant, evapTemp, condTemp, airVelocity, finTypeKey, d_evap_in, d_cond_in, humidity, coilTypeKey) {
        const app = appData[appKey];
        const refData = refrigerantProps[refrigerant];
        if (!app || !refData) return null;
        
        const dynamicCOP = estimateCOP(evapTemp, condTemp, appKey);
        let Q_evap = power_watt;
        let Q_cond = Q_evap * (1 + 1/dynamicCOP);
        
        let dtEvap = app.t_air_in_evap - evapTemp;
        let dtCond = condTemp - app.t_air_in_cond;
        if (dtEvap < 1) dtEvap = 1;
        if (dtCond < 1) dtCond = 1;
        
        let fin = finTypes[finTypeKey];
        const coilFactor = coilTypes[coilTypeKey]?.factor || 1.0;
        
        let U_evap_base = (25 + 10 * airVelocity) * fin.area_mult * coilFactor;
        let U_cond_base = (50 + 15 * airVelocity) * fin.area_mult * coilFactor;
        if (fin.area_mult > 20) {
            U_evap_base *= 1.1;
            U_cond_base *= 1.1;
        }
        U_evap_base = Math.min(U_evap_base, 150);
        U_cond_base = Math.min(U_cond_base, 250);
        
        let A_evap = Q_evap / (U_evap_base * dtEvap);
        let A_cond = Q_cond / (U_cond_base * dtCond);
        
        let d_evap_m = d_evap_in * 0.0254;
        let d_cond_m = d_cond_in * 0.0254;
        
        let lengthEvap = A_evap / (Math.PI * d_evap_m) * 1.15;
        let lengthCond = A_cond / (Math.PI * d_cond_m) * 1.15;
        
        return {
            mode: 'سريع (تقديري مع COP ديناميكي)',
            app_name: app.name,
            refrigerant,
            COP: dynamicCOP.toFixed(2),
            evap: { length_m: lengthEvap.toFixed(2), diameter_inch: d_evap_in },
            cond: { length_m: lengthCond.toFixed(2), diameter_inch: d_cond_in },
            warnings: 'نتائج تقريبية، يفضل استخدام الوضع المتقدم للدقة'
        };
    }
    
    const calculateCoils = () => {
        try {
            const powerVal = parseFloat(document.getElementById('ec_power_value')?.value);
            const powerUnit = document.getElementById('ec_power_unit')?.value;
            const app = document.getElementById('ec_app')?.value;
            const refrigerant = document.getElementById('ec_refrigerant')?.value;
            let d_evap_in = parseFloat(document.getElementById('ec_d_evap')?.value);
            let d_cond_in = parseFloat(document.getElementById('ec_d_cond')?.value);
            const finType = document.getElementById('ec_fin_type')?.value;
            let airVelocity = parseFloat(document.getElementById('ec_air_vel')?.value);
            let evapTemp = parseFloat(document.getElementById('ec_evap_temp')?.value);
            let condTemp = parseFloat(document.getElementById('ec_cond_temp')?.value);
            const mode = document.getElementById('ec_mode')?.value === 'advanced' ? 'advanced' : 'quick';
            const humidity = parseFloat(document.getElementById('ec_humidity')?.value || 50) / 100;
            const coilType = document.getElementById('ec_coil_type')?.value || 'staggered';
            
            if (isNaN(powerVal) || powerVal <= 0 || !app || !refrigerant || isNaN(airVelocity) || isNaN(evapTemp) || isNaN(condTemp)) {
                showToast('يرجى إدخال جميع القيم بشكل صحيح', 'warning');
                return;
            }
            
            const powerWatt = convertPower(powerVal, powerUnit).watt;
            if (powerWatt <= 0) throw new Error('قدرة غير صالحة');
            
            let result;
            if (mode === 'advanced') {
                result = advancedDesign(powerWatt, app, refrigerant, evapTemp, condTemp, airVelocity, finType, d_evap_in, d_cond_in, humidity, coilType);
            } else {
                result = quickDesign(powerWatt, app, refrigerant, evapTemp, condTemp, airVelocity, finType, d_evap_in, d_cond_in, humidity, coilType);
            }
            
            if (!result) throw new Error('فشل في الحساب');
            
            let displayObj = {
                ' وضع الحساب': result.mode,
                'نوع التطبيق': result.app_name,
                'الفريون': result.refrigerant,
                'القدرة الكهربائية (واط)': powerWatt.toFixed(0),
                'حمل التبريد (كيلوواط)': result.Q_evap_kW || (powerWatt/1000).toFixed(2),
                'حمل المكثف (كيلوواط)': result.Q_cond_kW || '?',
                'COP الديناميكي المقدر': result.COP || '?',
                '--- المبخر ---': '',
                'حرارة التبخير/دخول الهواء': `${evapTemp}°C / ${result.evap?.t_air_in || '?'}°C`,
                'LMTD (المبخر)': result.evap?.LMTD || '?',
                'معامل U (واط/م²·ك)': result.evap?.U || '?',
                'طول الأنبوب المطلوب (متر)': result.evap?.length_m || '?',
                'قطر الأنبوب (بوصة)': result.evap?.diameter_inch || d_evap_in,
                'سرعة الفريون (م/ث)': result.evap?.ref_velocity_mps || '?',
                'فقد ضغط الفريون (psi)': result.evap?.pressure_drop_psi || '?',
                'تدفق الهواء المطلوب (CFM)': result.evap?.airflow_cfm || '?',
                'Face velocity (م/ث)': result.evap?.face_velocity_mps || '?',
                'عرض/ارتفاع الملف (سم)': result.evap?.face_width_cm && result.evap?.face_height_cm ? `${result.evap.face_width_cm} / ${result.evap.face_height_cm}` : '?',
                'عدد اللفات التقريبي': result.evap?.turns || '?',
                '--- المكثف ---': '',
                'حرارة التكثيف/دخول الهواء': `${condTemp}°C / ${result.cond?.t_air_in || '?'}°C`,
                'LMTD (المكثف)': result.cond?.LMTD || '?',
                'طول الأنبوب (متر)': result.cond?.length_m || '?',
                'سرعة الفريون (م/ث)': result.cond?.ref_velocity_mps || '?',
                'فقد ضغط الفريون (psi)': result.cond?.pressure_drop_psi || '?',
                'Face velocity (م/ث)': result.cond?.face_velocity_mps || '?',
                'عدد اللفات التقريبي': result.cond?.turns || '?',
                '--- معاملات التصميم ---': '',
                'نوع الزعانف': finType,
                'نوع الكويل': result.coil_type || 'مصفوفة',
                'رطوبة الهواء النسبية': result.humidity || '50%',
                'سرعة الهواء (م/ث)': airVelocity,
                'تنبيهات وتوصيات': result.warnings
            };
            showFullRes(' تصميم المبخر والمكثف (نتائج)', displayObj);
        } catch(err) {
            console.error(err);
            showToast('خطأ في الحساب: ' + err.message, 'error');
        }
    };
    
    const refrigerantOptions = Object.keys(refrigerantProps).map(r => `<option value="${r}">${r}</option>`).join('');
    const finOptions = Object.keys(finTypes).map(f => `<option value="${f}">${f}</option>`).join('');
    const coilOptions = Object.keys(coilTypes).map(c => `<option value="${c}">${coilTypes[c].name}</option>`).join('');
    
    const buildDiameterSelect = (id, defaultValue) => {
        let html = `<select id="${id}" style="width:100%;">`;
        for (let d of diameterOptions) {
            let selected = (d === defaultValue) ? 'selected' : '';
            html += `<option value="${d}" ${selected}>${diamLabels[d]} (${d}")</option>`;
        }
        html += `</select>`;
        return html;
    };
    
    setContent(`
        <div class="flex flex-col gap-4" dir="rtl">
            <div class="flex flex-wrap gap-3">
                <div class="flex-1 min-w-[180px]">
                    <label class="block mb-1 text-sm font-semibold">وضع الحساب</label>
                    <select id="ec_mode" style="width:100%;">
                        <option value="quick"> سريع (تقديري)</option>
                        <option value="advanced" selected> متقدم (LMTD + U حقيقي)</option>
                    </select>
                </div>
                <div class="flex-1 min-w-[150px]">
                    <label class="block mb-1 text-sm font-semibold">نوع الكويل</label>
                    <select id="ec_coil_type" style="width:100%;">${coilOptions}</select>
                </div>
            </div>
            <div class="flex flex-wrap gap-3">
                <div class="flex-1 min-w-[150px]">
                    <label class="block mb-1 text-sm font-semibold">نوع التطبيق</label>
                    <select id="ec_app" style="width:100%;">
                        <option value="ac"> تكييف عادي</option>
                        <option value="cooler"> غرفة تبريد</option>
                        <option value="freezer"> غرفة تجميد</option>
                    </select>
                </div>
                <div class="flex-1 min-w-[150px]">
                    <label class="block mb-1 text-sm font-semibold">نوع الفريون</label>
                    <select id="ec_refrigerant" style="width:100%;">${refrigerantOptions}</select>
                </div>
            </div>
            <div>
                <label class="block mb-1 text-sm font-semibold">القدرة</label>
                <div class="flex gap-2">
                    <input type="number" step="any" id="ec_power_value" value="1.5" style="flex:2;">
                    <select id="ec_power_unit" style="flex:1;">
                        <option value="hp">حصان (HP)</option>
                        <option value="btu">BTU/h</option>
                        <option value="watt">واط</option>
                    </select>
                </div>
            </div>
            <div class="flex flex-wrap gap-3">
                <div class="flex-1">
                    <label class="block mb-1 text-sm font-semibold">حرارة التبخير (°C)</label>
                    <input type="number" step="any" id="ec_evap_temp" value="7" style="width:100%;">
                </div>
                <div class="flex-1">
                    <label class="block mb-1 text-sm font-semibold">حرارة التكثيف (°C)</label>
                    <input type="number" step="any" id="ec_cond_temp" value="50" style="width:100%;">
                </div>
            </div>
            <div class="flex flex-wrap gap-3">
                <div class="flex-1">
                    <label class="block mb-1 text-sm font-semibold">قطر المبخر (بوصة)</label>
                    ${buildDiameterSelect('ec_d_evap', 0.375)}
                </div>
                <div class="flex-1">
                    <label class="block mb-1 text-sm font-semibold">قطر المكثف (بوصة)</label>
                    ${buildDiameterSelect('ec_d_cond', 0.5)}
                </div>
            </div>
            <div class="flex flex-col gap-4">
                <div>
                    <label class="block mb-1 text-sm font-semibold">نوع الزعانف</label>
                    <select id="ec_fin_type" style="width:100%;">${finOptions}</select>
                </div>
                <div class="flex flex-wrap gap-3">
                    <div class="flex-1">
                        <label class="block mb-1 text-sm font-semibold">سرعة الهواء (م/ث)</label>
                        <input type="number" step="0.1" id="ec_air_vel" value="2.5" style="width:100%;">
                    </div>
                    <div class="flex-1">
                        <label class="block mb-1 text-sm font-semibold">الرطوبة (%)</label>
                        <input type="number" step="1" id="ec_humidity" value="50" style="width:100%;">
                    </div>
                </div>
            </div>
        </div>
    `);
    
    const appSelect = document.getElementById('ec_app');
    if (appSelect) {
        const evapInput = document.getElementById('ec_evap_temp');
        const condInput = document.getElementById('ec_cond_temp');
        const velInput = document.getElementById('ec_air_vel');
        
        const updateDefaults = () => {
            const app = appSelect.value;
            const def = appData[app];
            if (def) {
                if (evapInput && !evapInput._userChanged) evapInput.value = def.default_evap_temp;
                if (condInput && !condInput._userChanged) condInput.value = def.default_cond_temp;
                if (velInput && !velInput._userChanged) velInput.value = def.default_air_vel;
                clearResult();
            }
        };
        
        if (evapInput) evapInput.addEventListener('input', () => { evapInput._userChanged = true; });
        if (condInput) condInput.addEventListener('input', () => { condInput._userChanged = true; });
        if (velInput) velInput.addEventListener('input', () => { velInput._userChanged = true; });
        
        appSelect.addEventListener('change', updateDefaults);
        updateDefaults();
    }
    
    const bindInputs = () => {
        const inputs = ['ec_power_value', 'ec_power_unit', 'ec_app', 'ec_refrigerant', 'ec_d_evap', 'ec_d_cond', 'ec_fin_type', 'ec_air_vel', 'ec_evap_temp', 'ec_cond_temp', 'ec_mode', 'ec_humidity', 'ec_coil_type'];
        inputs.forEach(id => {
            const el = document.getElementById(id);
            if (el && !el.hasAttribute('data-ec-listener')) {
                el.addEventListener('input', () => clearResult());
                el.setAttribute('data-ec-listener', 'true');
            }
        });
    };
    bindInputs();
    setTimeout(bindInputs, 100);
    
    const existingBtn = document.getElementById('calculateBtn');
    if (existingBtn) {
        const newBtn = existingBtn.cloneNode(true);
        existingBtn.parentNode.replaceChild(newBtn, existingBtn);
        newBtn.onclick = (e) => {
            e.preventDefault();
            calculateCoils();
        };
        newBtn.disabled = false;
        newBtn.innerText = ' حساب';
    } else {
        const observer = new MutationObserver(() => {
            const btn = document.getElementById('calculateBtn');
            if (btn) {
                btn.onclick = (e) => {
                    e.preventDefault();
                    calculateCoils();
                };
                btn.disabled = false;
                btn.innerText = ' حساب';
                observer.disconnect();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
        setTimeout(() => observer.disconnect(), 2000);
    }
    return;
}


else if (toolId === 'ntc') {
    title.innerText = ' حساس NTC ';
    const ntcTypes = TOOL_CONSTANTS.ntc.types;
    
    function formatResistance(r) {
        if (r >= 1e6) return (r / 1e6).toFixed(2) + ' MΩ';
        if (r >= 1e3) return (r / 1e3).toFixed(2) + ' kΩ';
        if (r < 0.01) return r.toExponential(2) + ' Ω';
        if (r < 1) return r.toFixed(3) + ' Ω';
        return r.toFixed(2) + ' Ω';
    }
    
    function steinhartHart(R, A, B, C) {
        const lnR = Math.log(R);
        const invT = A + B * lnR + C * Math.pow(lnR, 3);
        return (1 / invT) - 273.15;
    }
    
    function betaEquation(R, R0, B, T0K) {
        const invT = 1 / T0K + (1 / B) * Math.log(R / R0);
        return (1 / invT) - 273.15;
    }
    
    window.ToolHelpers = window.ToolHelpers || {};
    
    ToolHelpers.setNtcMode = function(el, mode) {
        document.querySelectorAll('#modalBody .phase-option').forEach(o => o.classList.remove('selected'));
        el.classList.add('selected');
        const resDiv = document.getElementById('ntc_input_res_from_temp');
        const tempDiv = document.getElementById('ntc_input_temp_from_res');
        if (mode === 'temp_from_res') {
            tempDiv.style.display = 'block';
            resDiv.style.display = 'none';
        } else {
            tempDiv.style.display = 'none';
            resDiv.style.display = 'block';
        }
        clearResult();
    };
    
    ToolHelpers.ntcToggleCustom = function() {
        const type = document.getElementById('ntc_type').value;
        const isCustom = (type === 'custom');
        const equation = document.getElementById('ntc_equation').value;
        
        const customBetaDiv = document.getElementById('ntc_custom_beta');
        const customSteinhartDiv = document.getElementById('ntc_custom_steinhart');
        if (customBetaDiv) customBetaDiv.style.display = 'none';
        if (customSteinhartDiv) customSteinhartDiv.style.display = 'none';
        
        if (isCustom) {
            if (equation === 'beta') {
                if (customBetaDiv) customBetaDiv.style.display = 'block';
            } else if (equation === 'steinhart') {
                if (customSteinhartDiv) customSteinhartDiv.style.display = 'block';
            }
        }
        clearResult();
    };
    
    ToolHelpers.updateCustomFieldsOnEquation = function() {
        ToolHelpers.ntcToggleCustom();
    };
    
    ToolHelpers.computeNtc = function() {
        const type = document.getElementById('ntc_type').value;
        const equation = document.getElementById('ntc_equation').value;
        let R0, B, T0 = 25;
        let A, B_sh, C;
        let useSteinhart = (equation === 'steinhart');
        
        if (type === 'custom') {
            if (useSteinhart) {
                A = parseFloat(document.getElementById('ntc_a').value);
                B_sh = parseFloat(document.getElementById('ntc_b_sh').value);
                C = parseFloat(document.getElementById('ntc_c').value);
                if (!isFinite(A) || !isFinite(B_sh) || !isFinite(C)) {
                    showToast('معاملات Steinhart-Hart غير صحيحة', 'warning');
                    return;
                }
                T0 = parseFloat(document.getElementById('ntc_t0').value);
                R0 = parseFloat(document.getElementById('ntc_r0').value);
                if (!isFinite(T0) || !isFinite(R0) || R0 <= 0) {
                    showToast('القيم المرجعية (R0, T0) غير صحيحة', 'warning');
                    return;
                }
                B = parseFloat(document.getElementById('ntc_b').value);
                if (!isFinite(B)) B = 3950;
            } else {
                T0 = parseFloat(document.getElementById('ntc_t0').value);
                R0 = parseFloat(document.getElementById('ntc_r0').value);
                B = parseFloat(document.getElementById('ntc_b').value);
                if (!isFinite(T0) || !isFinite(R0) || !isFinite(B) || R0 <= 0 || B <= 0) {
                    showToast('القيم المخصصة لمعادلة Beta غير صحيحة', 'warning');
                    return;
                }
                A = 1.129241e-3; B_sh = 2.341077e-4; C = 8.767411e-8;
            }
        } else {
            const t = ntcTypes[type];
            R0 = t.R0;
            B = t.B;
            if (type === '10k_3950') {
                A = 1.129241e-3; B_sh = 2.341077e-4; C = 8.767411e-8;
            } else if (type === '5k_3470') {
                A = 1.138950e-3; B_sh = 2.354720e-4; C = 9.204174e-8;
            } else if (type === '15k_3977') {
                A = 1.128573e-3; B_sh = 2.348720e-4; C = 8.834127e-8;
            } else {
                A = 1.0e-3; B_sh = 2.5e-4; C = 1.0e-7;
            }
            T0 = 25;
        }
        
        const T0K = T0 + 273.15;
        const modeElem = document.querySelector('#modalBody .phase-option.selected');
        const mode = modeElem ? modeElem.dataset.mode : 'temp_from_res';
        let result = {};
        
        if (mode === 'temp_from_res') {
            const r = parseFloat(document.getElementById('ntc_r').value);
            if (!isFinite(r) || r <= 0) {
                showToast('أدخل مقاومة صحيحة', 'warning');
                return;
            }
            
            let tempC;
            if (useSteinhart) {
                tempC = steinhartHart(r, A, B_sh, C);
            } else {
                tempC = betaEquation(r, R0, B, T0K);
            }
            
            if (!isFinite(tempC) || isNaN(tempC)) {
                showToast(' الحساس تالف أو مفصول (قراءة غير منطقية)', 'error');
                return;
            }
            
            if (tempC < -20 || tempC > 80) {
                showToast(' الدقة تقل خارج المدى -20 إلى 80 درجة سيلسيوس', 'info');
            }
            
            result = {
                'نوع الحساس': type === 'custom' ? 'مخصص' : ntcTypes[type].name,
                'المقاومة': formatResistance(r),
                'درجة الحرارة': tempC.toFixed(2) + ' °C',
                'المعادلة': useSteinhart ? 'Steinhart-Hart (دقة عالية)' : 'Beta (تقريبية)'
            };
            
            if (tempC > 60) {
                result['تشخيص'] = ' حرارة عالية جداً (تحقق من التبريد أو موقع الحساس)';
            } else if (tempC > 40) {
                result['تشخيص'] = ' مرتفع (قد يكون طبيعياً في المكثف)';
            } else if (tempC < 0) {
                result['تشخيص'] = ' درجة حرارة تحت الصفر (احتمال تجمد أو قراءة خاطئة)';
            } else if (tempC < 10) {
                result['تشخيص'] = ' منخفضة (طبيعي في وضع التبريد)';
            } else {
                result['تشخيص'] = ' القراءة ضمن المدى الطبيعي';
            }
            
        } else {
            const t = parseFloat(document.getElementById('ntc_t').value);
            if (!isFinite(t)) {
                showToast('أدخل درجة حرارة صحيحة', 'warning');
                return;
            }
            
            let r = R0 * Math.exp(B * (1 / (t + 273.15) - 1 / T0K));
            
            if (!isFinite(r) || isNaN(r)) {
                showToast('نتيجة غير منطقية (تأكد من المدخلات)', 'error');
                return;
            }
            
            result = {
                'نوع الحساس': type === 'custom' ? 'مخصص' : ntcTypes[type].name,
                'درجة الحرارة': t.toFixed(2) + ' °C',
                'المقاومة': formatResistance(r),
                'المعادلة': 'Beta (لحساب المقاومة من الحرارة)'
            };
        }
        
        showFullRes('نتيجة الحساب', result);
    };
    
    const equationOptions = `
        <label>نوع المعادلة</label>
        <select id="ntc_equation">
            <option value="beta">Beta (قياسي سرعة)</option>
            <option value="steinhart">Steinhart-Hart (دقة عالية)</option>
        </select>
    `;
    
    setContent(`
        ${equationOptions}
        <label>نوع الحساس</label>
        <select id="ntc_type" onchange="ToolHelpers.ntcToggleCustom()">
            <option value="10k_3950">10KΩ (حساس الغرفة و الملف الداخلي)</option>
            <option value="5k_3470">5KΩ (حساس الملف الخارجى)</option>
            <option value="15k_3977">15KΩ (بعض الموديلات)</option>
            <option value="custom">مخصص</option>
        </select>
        <div class="phase-selector">
            <div class="phase-option selected" data-mode="temp_from_res" onclick="ToolHelpers.setNtcMode(this,'temp_from_res')">حرارة من مقاومة</div>
            <div class="phase-option" data-mode="res_from_temp" onclick="ToolHelpers.setNtcMode(this,'res_from_temp')">مقاومة من حرارة</div>
        </div>
        <div id="ntc_input_temp_from_res">
            <label>المقاومة (Ω)</label>
            <input type="number" step="any" id="ntc_r" value="10000">
        </div>
        <div id="ntc_input_res_from_temp" style="display:none;">
            <label>درجة الحرارة (°C)</label>
            <input type="number" step="any" id="ntc_t" value="25">
        </div>
        
        <div id="ntc_custom_beta" style="display:none;">
            <div style="margin-top:12px; padding:8px; background:#f9f9f9; border-radius:6px;">
                <label style="font-weight:bold;"> معادلة Beta (β)</label>
                <label>درجة الحرارة المرجعية T0 (°C)</label>
                <input type="number" step="any" id="ntc_t0" value="25">
                <label>المقاومة عند T0 (Ω)</label>
                <input type="number" step="any" id="ntc_r0" value="10000">
                <label>معامل Beta B (K)</label>
                <input type="number" step="any" id="ntc_b" value="3950">
            </div>
        </div>
        
        <div id="ntc_custom_steinhart" style="display:none;">
            <div style="margin-top:12px; padding:8px; background:#f9f9f9; border-radius:6px;">
                <label style="font-weight:bold;"> معادلة Steinhart-Hart</label>
                <label>المقاومة المرجعية R0 عند 25°C (Ω)</label>
                <input type="number" step="any" id="ntc_r0" value="10000">
                <label>معامل A</label>
                <input type="number" step="any" id="ntc_a" value="1.129241e-3">
                <label>معامل B</label>
                <input type="number" step="any" id="ntc_b_sh" value="2.341077e-4">
                <label>معامل C</label>
                <input type="number" step="any" id="ntc_c" value="8.767411e-8">
                <div class="text-xs text-gray-500">القيم الافتراضية مناسبة لحساس 10K3950</div>
            </div>
        </div>
    `, ToolHelpers.computeNtc);
    
    const equationSelect = document.getElementById('ntc_equation');
    if (equationSelect) {
        equationSelect.addEventListener('change', function() {
            ToolHelpers.updateCustomFieldsOnEquation();
        });
    }
    
    setTimeout(() => { 
        ToolHelpers.ntcToggleCustom();
    }, 50);
    return;
}

else if (toolId === 'ptcalc') {
    title.innerText = ' حاسبة P-T';
    const refrigerantOptions = Object.keys(refPTData).map(r => `<option value="${r}">${r}</option>`).join('');
    setContent(`
        <label>نوع الحساب</label>
        <select id="pt_mode">
            <option value="t2p">درجة الحرارة → الضغط</option>
            <option value="p2t">الضغط → درجة الحرارة</option>
        </select>
        <label>الفريون</label>
        <select id="pt_ref">${refrigerantOptions}</select>
        <div id="pt_input_area">
            <label>درجة الحرارة (°C)</label>
            <input type="number" step="any" id="pt_t" value="5">
        </div>
    `, () => {
        const mode = document.getElementById('pt_mode').value;
        const refrigerant = document.getElementById('pt_ref').value;
        const data = refPTData[refrigerant];
        if (!data) { showToast('لا توجد بيانات لهذا الفريون', 'warning'); return; }
        if (mode === 't2p') {
            const t = parseFloat(document.getElementById('pt_t').value);
            if (isNaN(t)) { showToast('أدخل درجة حرارة صحيحة', 'warning'); return; }
            const p = interpolatePressure(data, t);
            showFullRes('الضغط مقابل الحرارة', { 'الفريون': refrigerant, 'درجة الحرارة': t + ' °C', 'ضغط التشبع': p.toFixed(1) + ' PSI' });
        } else {
            const p = parseFloat(document.getElementById('pt_p').value);
            if (isNaN(p)) { showToast('أدخل ضغط صحيح', 'warning'); return; }
            const t = interpolateTemp(data, p);
            showFullRes('الحرارة مقابل الضغط', { 'الفريون': refrigerant, 'الضغط': p + ' PSI', 'درجة الحرارة': t.toFixed(1) + ' °C' });
        }
    });
    setTimeout(() => {
        const modeSelect = document.getElementById('pt_mode');
        const inputArea = document.getElementById('pt_input_area');
        const updatePTInputs = () => {
            if (modeSelect.value === 't2p') inputArea.innerHTML = `<label>درجة الحرارة (°C)</label><input type="number" step="any" id="pt_t" value="5">`;
            else inputArea.innerHTML = `<label>الضغط (PSI)</label><input type="number" step="any" id="pt_p" value="60">`;
            clearResult();
            const newInput = inputArea.querySelector('input');
            if (newInput) {
                newInput.addEventListener('change', clearResult);
                newInput.addEventListener('input', clearResult);
            }
        };
        modeSelect.addEventListener('change', updatePTInputs);
        const currentInput = inputArea.querySelector('input');
        if (currentInput) {
            currentInput.addEventListener('change', clearResult);
            currentInput.addEventListener('input', clearResult);
        }
    }, 50);
    return;
}

else if (toolId === 'heat') {
    title.innerText = ' سوبر هيت / صب كول';
    const refrigerantOptions = Object.keys(refPTData).map(r => `<option value="${r}">${r}</option>`).join('');
    
    setContent(`
        <div class="phase-selector mb-2">
            <div class="phase-option selected" data-shsc-mode="sh" onclick="ToolHelpers.setShScMode(this,'sh')"> Superheat</div>
            <div class="phase-option" data-shsc-mode="sc" onclick="ToolHelpers.setShScMode(this,'sc')">Subcooling</div>
        </div>
        <label>نوع الفريون</label>
        <select id="shsc_ref">${refrigerantOptions}</select>
        
        <label>نوع النظام</label>
        <select id="system_type">
            <option value="capillary">Capillary (أنبوب شعري)</option>
            <option value="txv">TXV (صمام تمدد)</option>
            <option value="inverter">Inverter (إنفرتر)</option>
        </select>

        <div id="sh_inputs">
            <label>ضغط السحب (PSI)</label><input type="number" step="any" id="sh_p" value="65">
            <label>حرارة نهاية ماسورة السحب (°C)</label><input type="number" step="any" id="sh_t" value="12">
        </div>
        <div id="sc_inputs" style="display:none;">
            <label>ضغط الطرد (PSI)</label><input type="number" step="any" id="sc_p" value="250">
            <label>حرارة نهاية خط السائل (°C)</label><input type="number" step="any" id="sc_t" value="35">
        </div>
        <div class="instruction-box"> القيم الطبيعية: Superheat 5-12°C · Subcooling 5-10°C. تختلف حسب نوع النظام.</div>
    `, () => {
        const modeElem = document.querySelector('#modalBody .phase-option.selected[data-shsc-mode]');
        const mode = modeElem ? modeElem.dataset.shscMode : 'sh';
        const refrigerant = document.getElementById('shsc_ref').value;
        const systemType = document.getElementById('system_type').value;
        
        let satTemp, actualTemp, value, press, analysis = '';
        let shValue = null, scValue = null;

        if (mode === 'sh') {
            press = parseFloat(document.getElementById('sh_p').value);
            const lineTemp = parseFloat(document.getElementById('sh_t').value);

            if (isNaN(press) || press <= 0) {
                showToast('أدخل ضغط صحيح (أكبر من صفر)', 'warning');
                return;
            }
            if (isNaN(lineTemp)) {
                showToast('أدخل درجة حرارة صحيحة', 'warning');
                return;
            }

            satTemp = getTempFromPressure(refrigerant, press);
            if (isNaN(satTemp)) {
                showToast('الضغط خارج جدول الفريون أو فريون غير مدعوم', 'error');
                return;
            }

            actualTemp = lineTemp;
            value = actualTemp - satTemp;
            shValue = value;

            if (value < 0) {
                analysis = '?? قراءة غير منطقية (حساس خاطئ أو مكان قياس غير مناسب)';
            }
            else if (value < 2) {
                analysis = 'سوبر هيت منخفض جداً → خطر رجوع سائل للكمبروسر (Floodback)';
                if (systemType === 'txv') analysis += ' – تحقق من TXV عالق مفتوح.';
                else if (systemType === 'capillary') analysis += ' – زيادة شحن أو انسداد جزئي.';
            }
            else if (value < 5) {
                analysis = ' سوبر هيت منخفض → شحن زائد أو TXV مفتوح أكثر من اللازم';
            }
            else if (value <= 12) {
                analysis = 'سوبر هيت طبيعي (ممتاز)';
            }
            else if (value <= 20) {
                analysis = ' سوبر هيت مرتفع → نقص فريون، فلتر متسخ، أو ضعف تدفق هواء المبخر';
                if (systemType === 'inverter') analysis += ' – تحقق من سرعة الضاغط.';
            }
            else {
                analysis = ' سوبر هيت مرتفع جداً → نقص فريون شديد، انسداد كامل، أو صمام تمدد عالق مغلق';
            }

            if (['R407C', 'R404A', 'R410A'].includes(refrigerant)) {
                analysis += '\n ملاحظة: فريون خليط – القيم تقريبية وقد تختلف حسب نسبة المكونات.';
            }
        }
        else {
            press = parseFloat(document.getElementById('sc_p').value);
            const lineTemp = parseFloat(document.getElementById('sc_t').value);

            if (isNaN(press) || press <= 0) {
                showToast('أدخل ضغط صحيح (أكبر من صفر)', 'warning');
                return;
            }
            if (isNaN(lineTemp)) {
                showToast('أدخل درجة حرارة صحيحة', 'warning');
                return;
            }

            satTemp = getTempFromPressure(refrigerant, press);
            if (isNaN(satTemp)) {
                showToast('الضغط خارج جدول الفريون أو فريون غير مدعوم', 'error');
                return;
            }

            actualTemp = lineTemp;
            value = satTemp - actualTemp;
            scValue = value;

            if (value < 0) {
                analysis = ' قراءة غير منطقية (حرارة السائل أعلى من حرارة التشبع)';
            }
            else if (value < 3) {
                analysis = ' سوبر كول منخفض جداً → نقص فريون محتمل، أو فقاعات غاز في خط السائل';
                if (systemType === 'txv') analysis += ' – قد يسبب صفير وتجويع للمبخر.';
            }
            else if (value <= 10) {
                analysis = 'سوبر كول طبيعي';
            }
            else if (value <= 18) {
                analysis = ' سوبر كول مرتفع → شحن زائد، مكثف متسخ، أو ضعف مراوح المكثف';
            }
            else {
                analysis = ' سوبر كول مرتفع جداً → انسداد خط السائل (فلتر أو صمام تمدد عالق جزئياً)';
            }

            if (['R407C', 'R404A', 'R410A'].includes(refrigerant)) {
                analysis += '\n ملاحظة: فريون خليط – السوبر كول قد لا يكون دقيقاً مطلقاً.';
            }
        }

        let smartMsg = '';
        if (mode === 'sh' && shValue !== null) {
            const scPressElem = document.getElementById('sc_p');
            const scTempElem = document.getElementById('sc_t');
            if (scPressElem && scTempElem) {
                const testScPress = parseFloat(scPressElem.value);
                const testScTemp = parseFloat(scTempElem.value);
                if (!isNaN(testScPress) && testScPress > 0 && !isNaN(testScTemp)) {
                    const satTempSc = getTempFromPressure(refrigerant, testScPress);
                    if (!isNaN(satTempSc)) {
                        const dummySc = satTempSc - testScTemp;
                        if (!isNaN(dummySc)) scValue = dummySc;
                    }
                }
            }
            if (scValue !== null) smartMsg = smartDiagnosis(shValue, scValue);
        } else if (mode === 'sc' && scValue !== null) {
            const shPressElem = document.getElementById('sh_p');
            const shTempElem = document.getElementById('sh_t');
            if (shPressElem && shTempElem) {
                const testShPress = parseFloat(shPressElem.value);
                const testShTemp = parseFloat(shTempElem.value);
                if (!isNaN(testShPress) && testShPress > 0 && !isNaN(testShTemp)) {
                    const satTempSh = getTempFromPressure(refrigerant, testShPress);
                    if (!isNaN(satTempSh)) {
                        const dummySh = testShTemp - satTempSh;
                        if (!isNaN(dummySh)) shValue = dummySh;
                    }
                }
            }
            if (shValue !== null) smartMsg = smartDiagnosis(shValue, scValue);
        }

        if (smartMsg) analysis += '\n' + smartMsg;

        const resultObj = {
            'الفريون': refrigerant,
            'نوع النظام': systemType === 'capillary' ? 'شعري' : (systemType === 'txv' ? 'TXV' : 'إنفرتر'),
            'الضغط (PSI)': press.toFixed(1),
            'حرارة التشبع (°C)': satTemp.toFixed(1),
            'حرارة الخط المقاسة (°C)': actualTemp.toFixed(1),
        };
        resultObj[mode === 'sh' ? 'Superheat (°C)' : 'Subcooling (°C)'] = value.toFixed(1);
        resultObj['تشخيص الحالة'] = analysis;

        showFullRes(mode === 'sh' ? 'نتيجة Superheat' : 'نتيجة Subcooling', resultObj);
    });

    window.ToolHelpers.setShScMode = function(btn, mode) {
        document.querySelectorAll('#modalBody .phase-option[data-shsc-mode]').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        const shDiv = document.getElementById('sh_inputs');
        const scDiv = document.getElementById('sc_inputs');
        if (mode === 'sh') {
            shDiv.style.display = 'block';
            scDiv.style.display = 'none';
        } else {
            shDiv.style.display = 'none';
            scDiv.style.display = 'block';
        }
        if (typeof clearResult === 'function') clearResult();
    };
    return;
}

else if (toolId === 'flow') {
    title.innerText = ' معدل تدفق الهواء AHU';
    
    const CFM_TO_M3H = 1.699;
    const BTUH_PER_TON = 12000;
    
    let mode = 'ton';
    let stateFlow = {
        ton: 1.5,
        cfmTon: 400,
        load: 18000,
        dt: 11,
        shr: 0.75
    };
    
    function calcCFMByTon(ton, cfmTon) {
        return ton * cfmTon;
    }
    
    function calcCFMByLoad(load, dt, shr = 1) {
        const dtF = dt * 1.8;
        return (load * shr) / (1.08 * dtF);
    }
    
    const renderFlow = () => {
        setContent(`
            <div class="flex gap-2 mb-3">
                <button id="m1" class="tab-btn ${mode === 'ton' ? 'active' : ''}">حسب الطن</button>
                <button id="m2" class="tab-btn ${mode === 'load' ? 'active' : ''}">حسب الحمل</button>
            </div>
            ${mode === 'ton' ? `
                <label>القدرة (طن)</label>
                <input type="number" step="any" id="f_ton" value="${stateFlow.ton}">
                <label>CFM لكل طن (حسب نوع التطبيق)</label>
                <select id="f_cfmTon">
                    <option value="350" ${stateFlow.cfmTon === 350 ? 'selected' : ''}>350 (رطوبة عالية - مناطق ساحلية)</option>
                    <option value="400" ${stateFlow.cfmTon === 400 ? 'selected' : ''}>400 (قياسي - تكييف مريح)</option>
                    <option value="450" ${stateFlow.cfmTon === 450 ? 'selected' : ''}>450 (جاف - مناخ صحراوي)</option>
                </select>
                <label>SHR (نسبة الحمل المحسوس - اختياري)</label>
                <input type="number" step="0.01" id="f_shr_ton" value="${stateFlow.shr}" placeholder="0.75">
            ` : `
                <label>الحمل الحراري (BTU/h)</label>
                <input type="number" step="any" id="f_load" value="${stateFlow.load}">
                <label>فرق الحرارة ΔT (°C)</label>
                <input type="number" step="any" id="f_dt" value="${stateFlow.dt}">
                <label>SHR (نسبة الحمل المحسوس - اختياري)</label>
                <input type="number" step="0.01" id="f_shr_load" value="${stateFlow.shr}" placeholder="0.75">
                <div class="text-xs text-gray-500 mt-1">ملاحظة: ΔT بين 5 و 20 درجة مئوية للحصول على نتائج منطقية</div>
            `}
        `, () => {
            let flow = 0;
            let shrValue = 1;
            
            if (mode === 'ton') {
                const ton = parseFloat(document.getElementById('f_ton').value);
                const cfmTon = parseFloat(document.getElementById('f_cfmTon').value);
                const shrInput = parseFloat(document.getElementById('f_shr_ton')?.value);
                shrValue = (isNaN(shrInput) || shrInput <= 0 || shrInput > 1) ? 1 : shrInput;
                
                if (isNaN(ton) || ton <= 0) {
                    showToast('أدخل قيمة طن صحيحة (أكبر من 0)', 'warning');
                    return;
                }
                
                flow = calcCFMByTon(ton, cfmTon);
                
                stateFlow.ton = ton;
                stateFlow.cfmTon = cfmTon;
                stateFlow.shr = shrValue;
            } else {
                const load = parseFloat(document.getElementById('f_load').value);
                const dt = parseFloat(document.getElementById('f_dt').value);
                const shrInput = parseFloat(document.getElementById('f_shr_load')?.value);
                shrValue = (isNaN(shrInput) || shrInput <= 0 || shrInput > 1) ? 1 : shrInput;
                
                if (isNaN(load) || load <= 0) {
                    showToast('أدخل حملاً صحيحاً (أكبر من 0)', 'warning');
                    return;
                }
                if (isNaN(dt) || dt <= 0) {
                    showToast('أدخل فرق حرارة صحيحاً', 'warning');
                    return;
                }
                if (dt < 5 || dt > 20) {
                    showToast(' فرق الحرارة الموصى به بين 5 و 20 درجة مئوية', 'info');
                }
                
                flow = calcCFMByLoad(load, dt, shrValue);
                
                stateFlow.load = load;
                stateFlow.dt = dt;
                stateFlow.shr = shrValue;
            }
            
            if (flow > 3000) {
                showToast(' تنبيه: معدل الهواء مرتفع جداً (>3000 CFM)، راجع حساباتك', 'info');
            } else if (flow < 200 && mode === 'load') {
                showToast('ملاحظة: معدل الهواء منخفض، تأكد من قيم الحمل وΔT', 'info');
            }
            
            const m3h = flow * CFM_TO_M3H;
            
            const extraData = {
                'CFM': Math.round(flow),
                'm³/h': Math.round(m3h)
            };
            
            if (mode === 'ton') {
                extraData['نوع التطبيق'] = 
                    stateFlow.cfmTon === 350 ? 'رطوبة عالية' : 
                    stateFlow.cfmTon === 400 ? 'قياسي' : 'مناخ جاف';
                extraData['CFM/طن'] = stateFlow.cfmTon;
            } else {
                extraData['ΔT (°C)'] = stateFlow.dt;
                extraData['CFM/طن مقدر'] = Math.round(flow / (stateFlow.load / BTUH_PER_TON));
            }
            
            if (shrValue !== 1) {
                extraData['SHR المستخدم'] = shrValue;
            }
            
            showFullRes('معدل تدفق الهواء', extraData);
        });
        
        document.getElementById('m1')?.addEventListener('click', () => {
            mode = 'ton';
            clearResult();
            renderFlow();
        });
        document.getElementById('m2')?.addEventListener('click', () => {
            mode = 'load';
            clearResult();
            renderFlow();
        });
    };
    
    renderFlow();
    return;
}

else if (toolId === 'refrigerant_charge') {
    title.innerText = ' شحنة الفريون (جرام)';
    
    const chargePerMeterRealistic = TOOL_CONSTANTS.chargePerMeterRealistic;
    const innerDiameters = TOOL_CONSTANTS.innerDiameters_mm;
    const densitiesByTemp = TOOL_CONSTANTS.densitiesByTemp;
    const systemCorrection = TOOL_CONSTANTS.systemCorrection;
    
    let mode = 'simple';
    
    function updateGasInfo(selectedGas) {
        const infoDiv = document.getElementById('gasInfoDisplay');
        const refData = TOOL_CONSTANTS.ref_table.tableData[selectedGas];
        if (infoDiv && refData) {
            infoDiv.innerHTML = `<div class="text-xs bg-blue-50 p-2 rounded mt-2">
                 ضغط السحب: ${refData.suction} psi | ضغط الطرد: ${refData.discharge} psi | ضغط التوقف: ${refData.stop} psi
            </div>`;
        } else if (infoDiv) {
            infoDiv.innerHTML = '<div class="text-xs text-red-500 p-2"> لا توجد بيانات ضغوط لهذا الفريون</div>';
        }
    }
    
    let renderUI = () => {
        let html = `
            <div class="flex gap-2 mb-3 flex-wrap">
                <button id="modeSimple" class="tab-btn ${mode === 'simple' ? 'active' : ''}"> تقريبي</button>
                <button id="modePrecise" class="tab-btn ${mode === 'precise' ? 'active' : ''}">دقيق </button>
                <button id="modeFull" class="tab-btn ${mode === 'full' ? 'active' : ''}">كامل  </button>
            </div>
        `;
        
        if (mode === 'simple') {
            html += `
                <label>الشحنة الأساسية من المصنع (جرام)</label>
                <input type="number" step="any" id="factory_charge_simple" value="800" placeholder="مثال: 800">
                <label>الطول الفعلي للمواسير (م)</label>
                <input type="number" step="any" id="actual_length" value="10">
                <label>الطول القياسي للمصنع (م)</label>
                <input type="number" step="any" id="std_length" value="5">
                <label>الزيادة لكل متر إضافي (جرام/م) - من الكتالوج</label>
                <input type="number" step="any" id="extra_per_meter" value="65" placeholder="مثال: 65 جرام/م لـ R410A قطر 3/8">
                <div class="instruction-box text-xs mt-2"> هذا الوضع مناسب إذا كنت تعرف قيمة الزيادة لكل متر من كتالوج الجهاز بدقة و لا تنسى متابعة الضغط و الامبير و اداء الجهاز </div>
            `;
        } 
        else if (mode === 'precise') {
            let refOpts = Object.keys(chargePerMeterRealistic).map(r => `<option value="${r}">${r}</option>`).join('');
            let diamOpts = Object.keys(innerDiameters).map(d => `<option value="${d}">${d} (${innerDiameters[d]} مم)</option>`).join('');
            let systemOpts = Object.keys(systemCorrection).map(s => `<option value="${s}">${s}</option>`).join('');
            let tempOpts = `<option value="35">35°C</option><option value="40" selected>40°C</option><option value="45">45°C</option>`;
            
            html += `
                <label> نوع الغاز</label>
                <select id="ref_precise">${refOpts}</select>
                <div id="gasInfoDisplay" class="text-xs"></div>
                
                <label class="mt-2"> قطر الماسورة السائلة</label>
                <select id="diam_precise">${diamOpts}</select>
                
                <label> نوع النظام</label>
                <select id="system_type">${systemOpts}</select>
                
                <label> درجة حرارة التكثيف</label>
                <select id="cond_temp">${tempOpts}</select>
                
                <label> الطول الفعلي للمواسير (م)</label>
                <input type="number" step="any" id="actual_len_precise" value="15">
                
                <label> الطول الأساسي للمصنع (م)</label>
                <input type="number" step="any" id="base_len_precise" value="5">
                
                <label> شحنة المصنع الأساسية (جرام) - موجودة على البلاتة</label>
                <input type="number" step="any" id="factory_charge_precise" value="1000">
                
                <div class="mt-2 p-2 border rounded bg-gray-50">
                    <label class="font-bold text-sm"> طريقة حساب الزيادة:</label>
                    <select id="calc_method_precise">
                        <option value="auto">تلقائي (من جدول الشركات)</option>
                        <option value="manual">يدوي (أدخل جرام/م من الكتالوج)</option>
                    </select>
                    <div id="manual_gram_div_precise" style="display:none;">
                        <label class="mt-2">الشحنة لكل متر إضافي (جرام/م)</label>
                        <input type="number" step="any" id="manual_gram_precise" value="65">
                    </div>
                </div>
                <div class="instruction-box text-xs mt-2"> لا تنسى متابعة الضغط و الامبير و اداء الجهاز </div>
            `;
        }
        else if (mode === 'full') {
            let refOpts = Object.keys(densitiesByTemp).map(r => `<option value="${r}">${r}</option>`).join('');
            let diamOpts = Object.keys(innerDiameters).map(d => `<option value="${d}">${d} (${innerDiameters[d]} مم)</option>`).join('');
            let tempOpts = `<option value="35">35°C</option><option value="40" selected>40°C</option><option value="45">45°C</option>`;
            
            html += `
                <label> نوع الغاز</label>
                <select id="ref_full">${refOpts}</select>
                <div id="gasInfoFull" class="text-xs"></div>
                
                <label> قطر ماسورة السائل</label>
                <select id="diam_liquid_full">${diamOpts}</select>
                
                <label> قطر ماسورة الغاز (الراجع)</label>
                <select id="diam_gas_full">${diamOpts}</select>
                
                <label> طول ماسورة السائل (م)</label>
                <input type="number" step="any" id="len_liquid" value="10">
                
                <label> طول ماسورة الغاز  (م)</label>
                <input type="number" step="any" id="len_gas" value="10">
                
                <label> درجة حرارة التكثيف</label>
                <select id="cond_temp_full">${tempOpts}</select>
                
                <div class="mt-2 p-2 border rounded">
                    <label class="inline-flex items-center">
                        <input type="checkbox" id="fully_charged" class="ml-2"> النظام مفلور بالكامل (بمعنى الماسورة الغازية فيها سائل مضغوط)
                    </label>
                    <div class="text-xs text-gray-600 mt-1"> إذا كان النظام يعمل طبيعياً الماسورة الغازية تحتوي على بخار فقط اختر المربع فقط إذا كانت الماسورة الغازية مليئة سائل (نادر)</div>
                </div>
                
                <label class="mt-2"> شحنة المصنع الأساسية (جرام) - تضاف إلى شحنة المواسير</label>
                <input type="number" step="any" id="factory_charge_full" value="800">
                
                <div class="instruction-box text-xs mt-2">هذا الوضع يحسب كمية الفريون داخل المواسير بناءً على حجمها الداخلي وكثافة الغاز عند درجة حرارة التكثيف مثالي عند تفريغ النظام بالكامل وإعادة الشحن و لا تنسى متابعة الضغط و الامبير و اداء الجهاز </div>
            `;
        }
        
        body.innerHTML = html;
        bindClearResultOnChange(body);
        
        if (mode === 'precise') {
            const gasSelect = document.getElementById('ref_precise');
            if (gasSelect) {
                updateGasInfo(gasSelect.value);
                gasSelect.onchange = () => updateGasInfo(gasSelect.value);
            }
            const methodSelect = document.getElementById('calc_method_precise');
            const manualDiv = document.getElementById('manual_gram_div_precise');
            if (methodSelect) {
                methodSelect.onchange = () => {
                    manualDiv.style.display = methodSelect.value === 'manual' ? 'block' : 'none';
                    clearResult();
                };
                manualDiv.style.display = methodSelect.value === 'manual' ? 'block' : 'none';
            }
        } else if (mode === 'full') {
            const gasSelect = document.getElementById('ref_full');
            if (gasSelect) {
                const infoDiv = document.getElementById('gasInfoFull');
                if (infoDiv) {
                    const refData = TOOL_CONSTANTS.ref_table.tableData[gasSelect.value];
                    if (refData) {
                        infoDiv.innerHTML = `<div class="text-xs bg-blue-50 p-2 rounded mt-2"> ضغط السحب: ${refData.suction} psi | ضغط الطرد: ${refData.discharge} psi | ضغط التوقف: ${refData.stop} psi</div>`;
                    }
                }
                gasSelect.onchange = () => {
                    const newRef = gasSelect.value;
                    const newData = TOOL_CONSTANTS.ref_table.tableData[newRef];
                    if (infoDiv && newData) {
                        infoDiv.innerHTML = `<div class="text-xs bg-blue-50 p-2 rounded mt-2"> ضغط السحب: ${newData.suction} psi | ضغط الطرد: ${newData.discharge} psi | ضغط التوقف: ${newData.stop} psi</div>`;
                    }
                };
            }
        }
        
        const btnSimple = document.getElementById('modeSimple');
        const btnPrecise = document.getElementById('modePrecise');
        const btnFull = document.getElementById('modeFull');
        if (btnSimple) btnSimple.onclick = () => { mode = 'simple'; clearResult(); renderUI(); };
        if (btnPrecise) btnPrecise.onclick = () => { mode = 'precise'; clearResult(); renderUI(); };
        if (btnFull) btnFull.onclick = () => { mode = 'full'; clearResult(); renderUI(); };
        
        calcBtn.onclick = () => withLoading(calcBtn, () => {
            if (mode === 'simple') {
                let factory = parseFloat(document.getElementById('factory_charge_simple').value);
                let actual = parseFloat(document.getElementById('actual_length').value);
                let std = parseFloat(document.getElementById('std_length').value);
                let extraPerM = parseFloat(document.getElementById('extra_per_meter').value);
                if (isNaN(factory) || isNaN(actual) || isNaN(std) || isNaN(extraPerM)) {
                    showToast('أدخل جميع القيم بشكل صحيح', 'warning');
                    return;
                }
                let extraLen = Math.max(0, actual - std);
                let extraCharge = extraLen * extraPerM;
                let total = factory + extraCharge;
                
                let warnings = [];
                if (extraLen > 30) warnings.push(' الطول الإضافي كبير جداً (>30م) - يفضل زيادة قطر الماسورة أو إعادة تصميم');
                if (extraCharge > 1000) warnings.push(' الشحنة الإضافية أكبر من 1000 جرام - تأكد من سعة النظام');
                
                showFullRes('شحنة الفريون (طريقة تقريبية)', {
                    ' تنبيهات': warnings.length ? warnings.join(' | ') : 'لا توجد',
                    'شحنة المصنع': factory.toFixed(0) + ' جرام',
                    'الطول القياسي': std + ' م',
                    'الطول الفعلي': actual + ' م',
                    'الطول الإضافي': extraLen + ' م',
                    'الزيادة لكل متر': extraPerM.toFixed(0) + ' جرام/م',
                    'الشحنة الإضافية': extraCharge.toFixed(0) + ' جرام',
                    ' الشحنة الكلية الموصى بها': total.toFixed(0) + ' جرام'
                });
            } 
            else if (mode === 'precise') {
                let ref = document.getElementById('ref_precise').value;
                let diam = document.getElementById('diam_precise').value;
                let system = document.getElementById('system_type').value;
                let temp = parseFloat(document.getElementById('cond_temp').value);
                let actualLen = parseFloat(document.getElementById('actual_len_precise').value);
                let baseLen = parseFloat(document.getElementById('base_len_precise').value);
                let factoryCharge = parseFloat(document.getElementById('factory_charge_precise').value);
                let method = document.getElementById('calc_method_precise').value;
                let manualGram = parseFloat(document.getElementById('manual_gram_precise')?.value);
                
                if (isNaN(actualLen) || isNaN(baseLen) || isNaN(factoryCharge)) {
                    showToast('أدخل القيم بشكل صحيح', 'warning');
                    return;
                }
                
                let gramPerMeter;
                let extraLen = Math.max(0, actualLen - baseLen);
                let extraCharge;
                let details = {};
                
                if (method === 'manual' && !isNaN(manualGram) && manualGram > 0) {
                    gramPerMeter = manualGram;
                    extraCharge = gramPerMeter * extraLen;
                    details['طريقة الحساب'] = 'يدوي (من الكتالوج)';
                    details['قيمة الإدخال'] = gramPerMeter.toFixed(1) + ' جرام/م';
                } else {
                    if (!chargePerMeterRealistic[ref] || !chargePerMeterRealistic[ref][diam]) {
                        showToast('لا توجد بيانات حقيقية لهذا الغاز والقطر', 'error');
                        return;
                    }
                    gramPerMeter = chargePerMeterRealistic[ref][diam];
                    extraCharge = gramPerMeter * extraLen;
                    details['طريقة الحساب'] = 'تلقائي (من جدول كتالوجات الشركات)';
                    details['القيمة المعيارية'] = gramPerMeter.toFixed(1) + ' جرام/م';
                }
                
                let correction = systemCorrection[system] || 1.0;
                let extraChargeCorrected = extraCharge * correction;
                let totalCharge = factoryCharge + extraChargeCorrected;
                
                let tempCorrection = 1.0;
                if (densitiesByTemp[ref] && densitiesByTemp[ref][temp]) {
                    let baseDensity = densitiesByTemp[ref][40];
                    let actualDensity = densitiesByTemp[ref][temp];
                    tempCorrection = actualDensity / baseDensity;
                    extraChargeCorrected = extraCharge * correction * tempCorrection;
                    totalCharge = factoryCharge + extraChargeCorrected;
                }
                
                let warnings = [];
                if (extraLen > 30) warnings.push(' الطول الإضافي كبير جداً');
                if (extraChargeCorrected > 1000) warnings.push('الشحنة الإضافية > 1000 جرام، راجع قدرة النظام');
                
                showFullRes('شحنة الفريون ', {
                    'تنبيهات': warnings.length ? warnings.join(' | ') : 'لا توجد',
                    'نوع الغاز': ref,
                    'القطر السائل': diam + ` (${innerDiameters[diam]} مم)`,
                    'نوع النظام': system + ` (معامل ${correction})`,
                    'درجة حرارة التكثيف': temp + '°C',
                    'الطول الإضافي الفعلي': extraLen + ' م',
                    'الشحنة لكل متر (قاعدة)': gramPerMeter.toFixed(1) + ' جرام/م',
                    'الشحنة الإضافية بعد التصحيحات': extraChargeCorrected.toFixed(0) + ' جرام',
                    'شحنة المصنع الأساسية': factoryCharge.toFixed(0) + ' جرام',
                    'الشحنة الكلية النهائية': totalCharge.toFixed(0) + ' جرام'
                });
            }
            else if (mode === 'full') {
                let ref = document.getElementById('ref_full').value;
                let diamLiquid = document.getElementById('diam_liquid_full').value;
                let diamGas = document.getElementById('diam_gas_full').value;
                let lenLiquid = parseFloat(document.getElementById('len_liquid').value);
                let lenGas = parseFloat(document.getElementById('len_gas').value);
                let temp = parseFloat(document.getElementById('cond_temp_full').value);
                let fullyCharged = document.getElementById('fully_charged').checked;
                let factoryCharge = parseFloat(document.getElementById('factory_charge_full').value);
                
                if (isNaN(lenLiquid) || isNaN(lenGas) || isNaN(factoryCharge)) {
                    showToast('أدخل الأطوال بشكل صحيح', 'warning');
                    return;
                }
                
                let density = densitiesByTemp[ref]?.[temp];
                if (!density) {
                    showToast('لا توجد بيانات كثافة لهذا الغاز ودرجة الحرارة', 'error');
                    return;
                }
                
                let innerDiamLiquid_m = innerDiameters[diamLiquid] / 1000;
                let areaLiquid = Math.PI * Math.pow(innerDiamLiquid_m / 2, 2);
                let volumeLiquid = areaLiquid * lenLiquid;
                let massLiquid = volumeLiquid * density * 1000;
                
                let innerDiamGas_m = innerDiameters[diamGas] / 1000;
                let areaGas = Math.PI * Math.pow(innerDiamGas_m / 2, 2);
                let volumeGas = areaGas * lenGas;
                let massGas;
                if (fullyCharged) {
                    massGas = volumeGas * density * 1000;
                } else {
                    let vaporDensity = density * 0.05;
                    massGas = volumeGas * vaporDensity * 1000;
                }
                
                let totalPipingCharge = massLiquid + massGas;
                let totalSystemCharge = factoryCharge + totalPipingCharge;
                
                let warnings = [];
                if (lenLiquid + lenGas > 50) warnings.push('الطول الكلي كبير جداً (>50م)');
                if (totalPipingCharge > 2000) warnings.push(' شحنة المواسير وحدها كبيرة، تأكد من سعة الضاغط');
                
                showFullRes('شحنة الفريون (حساب حجم المواسير)', {
                    ' تنبيهات': warnings.length ? warnings.join(' | ') : 'لا توجد',
                    'نوع الغاز': ref,
                    'درجة الحرارة': temp + '°C',
                    'كثافة السائل المستخدمة': density + ' كجم/م³',
                    'قطر السائل': diamLiquid + ` (${innerDiameters[diamLiquid]} مم)`,
                    'طول السائل': lenLiquid + ' م',
                    'كتلة الفريون في السائل': massLiquid.toFixed(0) + ' جرام',
                    'قطر الغاز': diamGas + ` (${innerDiameters[diamGas]} مم)`,
                    'طول الغاز': lenGas + ' م',
                    'حالة الغاز': fullyCharged ? 'سائل مضغوط' : 'بخار (كثافة مقدرة 5%)',
                    'كتلة الفريون في الغاز': massGas.toFixed(0) + ' جرام',
                    'شحنة المصنع الأساسية': factoryCharge.toFixed(0) + ' جرام',
                    ' شحنة المواسير الكلية': totalPipingCharge.toFixed(0) + ' جرام',
                    ' شحنة النظام النهائية': totalSystemCharge.toFixed(0) + ' جرام'
                });
            }
        });
    };
    
    renderUI();
    return;
}

else if (toolId === 'air_velocity') {
    title.innerText = ' تصميم مجاري الهوا';
    
    const PROJECT_LIMITS = TOOL_CONSTANTS.projectLimits;
    
    function round2(v) { return Math.round(v * 100) / 100; }
    function round0(v) { return Math.round(v); }
    function round1(v) { return Math.round(v * 10) / 10; }
    function round4(v) { return Math.round(v * 10000) / 10000; }
    
    function toCFM(value, unit) {
        if (unit === 'cfm') return value;
        if (unit === 'm3h') return value / 1.699;
        return value;
    }
    
    function toM2(value, unit) {
        if (unit === 'm2') return value;
        if (unit === 'cm2') return value / 10000;
        if (unit === 'ft2') return value * 0.092903;
        return value;
    }
    
    setContent(`
        <div class="flex gap-2 mb-3">
            <label class="flex-1">طريقة الحساب</label>
            <select id="calc_mode" class="flex-1">
                <option value="velocity">حساب السرعة</option>
                <option value="size">حساب المقاس </option>
            </select>
        </div>
        
        <div id="mode_velocity_section">
            <div class="flex items-center gap-2 mb-2">
                <input type="checkbox" id="av_use_area_direct" class="inpchk"/>
                <label> إدخال المساحة مباشرة</label>
            </div>
            <div id="av_dimensions_div">
                <label> أبعاد الدكت</label>
                <div class="flex gap-2">
                    <input type="number" step="any" id="av_width" placeholder="العرض (م)" class="flex-1">
                    <input type="number" step="any" id="av_height" placeholder="الارتفاع (م)" class="flex-1">
                </div>
            </div>
            <div id="av_area_div" style="display:none;">
                <label> المساحة المباشرة</label>
                <div class="flex gap-2">
                    <input type="number" step="any" id="av_area" placeholder="المساحة" class="flex-1">
                    <select id="av_area_unit" class="w-1/3">
                        <option value="m2">م²</option>
                        <option value="cm2">سم²</option>
                        <option value="ft2">قدم²</option>
                    </select>
                </div>
            </div>
        </div>
        
        <div id="mode_size_section" style="display: none;">
            <label> السرعة المطلوبة (م/ث)</label>
            <input type="number" step="any" id="target_velocity" placeholder="مثال: 5" class="w-full">
            <div class="text-xs text-gray-500 mt-1">سيتم حساب المساحة المطلوبة</div>
        </div>
        
        <label>معدل التدفق</label>
        <div class="flex gap-2">
            <input type="number" step="any" id="av_flow" value="1200" class="flex-1">
            <select id="av_flow_unit" class="w-1/3">
                <option value="cfm">CFM</option>
                <option value="m3h">m³/h</option>
            </select>
        </div>
        
        <label> نوع المشروع</label>
        <select id="project_type">
            <option value="res">سكني (هادئ)</option>
            <option value="com">تجاري (مقبول ضوضاء)</option>
            <option value="ind">صناعي (تحمل عالي)</option>
        </select>
        
        <label> نوع الهواء</label>
        <select id="av_air_type">
            <option value="supply">Supply (هواء معالج)</option>
            <option value="return">Return (هواء راجع)</option>
            <option value="exhaust">Exhaust (هواء طارد)</option>
        </select>
        
        <label>شكل الدكت</label>
        <select id="duct_shape">
            <option value="rect">مستطيل</option>
            <option value="round">دائري</option>
        </select>
        
        <div id="round_dim_section" style="display: none;">
            <label>قطر الدكت (ملم)</label>
            <input type="number" step="any" id="av_diameter" placeholder="قطر الدائري" class="w-full">
        </div>
        
        <div class="text-xs text-gray-500 mt-3"> ملاحظة: في وضع حساب السرعة الأولوية للأبعاد (مستطيل أو دائري) ثم المساحة</div>
    `, () => {
        let flow = parseFloat(document.getElementById('av_flow').value);
        let flowUnit = document.getElementById('av_flow_unit').value;
        if (isNaN(flow) || flow <= 0) { showToast('أدخل تدفقاً صحيحاً (>0)', 'warning'); return; }
        let cfm = toCFM(flow, flowUnit);
        let m3s = cfm * 0.000471947;
        
        let airType = document.getElementById('av_air_type').value;
        let projectType = document.getElementById('project_type').value;
        let calcMode = document.getElementById('calc_mode').value;
        let ductShape = document.getElementById('duct_shape').value;
        
        let limits = PROJECT_LIMITS[projectType][airType];
        let minOk = limits.min;
        let maxOk = limits.max;
        let idealVel = limits.ideal;
        
        let areaM2 = null;
        let velocity_ms = null;
        let hydraulicDiameter = null;
        let resultArea = null;
        
        if (calcMode === 'velocity') {
            const useAreaDirect = document.getElementById('av_use_area_direct').checked;
            if (ductShape === 'rect') {
                if (useAreaDirect) {
                    let areaVal = parseFloat(document.getElementById('av_area').value);
                    let areaUnit = document.getElementById('av_area_unit').value;
                    if (!isNaN(areaVal) && areaVal > 0) {
                        areaM2 = toM2(areaVal, areaUnit);
                        hydraulicDiameter = null;
                    } else {
                        showToast(' أدخل مساحة صحيحة (>0)', 'warning');
                        return;
                    }
                } else {
                    let width = parseFloat(document.getElementById('av_width').value);
                    let height = parseFloat(document.getElementById('av_height').value);
                    if (!isNaN(width) && !isNaN(height) && width > 0 && height > 0) {
                        areaM2 = width * height;
                        hydraulicDiameter = (2 * width * height) / (width + height);
                    } else {
                        showToast(' أدخل أبعاداً صحيحة (العرض والارتفاع > 0)', 'warning');
                        return;
                    }
                }
            } else {
                let diam_mm = parseFloat(document.getElementById('av_diameter').value);
                if (!isNaN(diam_mm) && diam_mm > 0) {
                    let diam_m = diam_mm / 1000;
                    areaM2 = Math.PI * Math.pow(diam_m / 2, 2);
                    hydraulicDiameter = diam_m;
                } else {
                    if (useAreaDirect) {
                        let areaVal = parseFloat(document.getElementById('av_area').value);
                        let areaUnit = document.getElementById('av_area_unit').value;
                        if (!isNaN(areaVal) && areaVal > 0) {
                            areaM2 = toM2(areaVal, areaUnit);
                            hydraulicDiameter = null;
                        } else {
                            showToast(' أدخل قطر الدكت أو المساحة', 'warning');
                            return;
                        }
                    } else {
                        showToast(' أدخل قطر الدكت (ملم)', 'warning');
                        return;
                    }
                }
            }
            
            if (areaM2 === null || areaM2 <= 0) {
                showToast('تعذر حساب المساحة، تأكد من المدخلات', 'warning');
                return;
            }
            if (areaM2 < 0.005) {
                showToast('المساحة صغيرة جداً (أقل من 0.005 م²) - راجع الأبعاد', 'warning');
                return;
            }
            
            velocity_ms = m3s / areaM2;
        } else {
            let targetVel = parseFloat(document.getElementById('target_velocity').value);
            if (isNaN(targetVel) || targetVel <= 0) {
                showToast(' أدخل سرعة مستهدفة صحيحة (>0)', 'warning');
                return;
            }
            velocity_ms = targetVel;
            resultArea = m3s / velocity_ms;
            
            if (resultArea <= 0 || !isFinite(resultArea)) {
                showToast(' قيم التدفق أو السرعة تؤدي لمساحة غير منطقية', 'error');
                return;
            }
            areaM2 = resultArea;
        }
        
        if (velocity_ms > 12) {
            showToast('سرعة غير واقعية (>12 م/ث) - أعد النظر في التصميم', 'error');
            return;
        }
        if (calcMode === 'velocity' && ductShape === 'rect') {
            let w = parseFloat(document.getElementById('av_width')?.value);
            let h = parseFloat(document.getElementById('av_height')?.value);
            if (!isNaN(w) && !isNaN(h) && (w > 2 || h > 2)) {
                showToast(' أبعاد كبيرة جداً (>2م) غير شائعة', 'warning');
            }
        }
        
        let recommendation = '';
        let noiseWarning = '';
        let pressureWarning = '';
        let smartSuggestion = '';
        
        if (velocity_ms < minOk) {
            recommendation = ` سرعة منخفضة جداً (<${minOk} م/ث) - الدكت أكبر من اللازم، زيادة التكلفة`;
        } else if (velocity_ms <= maxOk) {
            recommendation = ` سرعة مثالية (تتراوح بين ${minOk}-${maxOk} م/ث) لهذا النوع من الهواء والمشروع`;
        } else if (velocity_ms <= maxOk + 1.5) {
            recommendation = `سرعة مرتفعة قليلاً (${round1(velocity_ms)} م/ث) - خطر ضوضاء بسيط`;
            noiseWarning = ' احتمال ضوضاء ملحوظة';
            pressureWarning = ' فقد ضغط متوسط';
        } else {
            recommendation = `سرعة خطيرة (${round1(velocity_ms)} م/ث) - أعد تصميم الدكت فوراً`;
            noiseWarning = 'ضوضاء عالية جداً غير مقبولة';
            pressureWarning = ' فقد ضغط كبير جداً واستهلاك طاقة مرتفع';
        }
        
        if (calcMode === 'velocity' && velocity_ms > maxOk + 0.5) {
            let suggestedArea = m3s / maxOk;
            smartSuggestion = ` اقتراح: لتقليل السرعة إلى ${maxOk} م/ث، استخدم مساحة ${round2(suggestedArea)} م²`;
            if (ductShape === 'rect' && !isNaN(parseFloat(document.getElementById('av_width')?.value)) && !isNaN(parseFloat(document.getElementById('av_height')?.value))) {
                let oldW = parseFloat(document.getElementById('av_width').value);
                let oldH = parseFloat(document.getElementById('av_height').value);
                let ratio = oldW / oldH;
                let newH = Math.sqrt(suggestedArea / ratio);
                let newW = newH * ratio;
                smartSuggestion += ` أو أبعاد تقريبية ${round2(newW)} × ${round2(newH)} م`;
            } else if (ductShape === 'round') {
                let suggestedDiam_m = 2 * Math.sqrt(suggestedArea / Math.PI);
                smartSuggestion += ` (قطر دائري ≈ ${Math.round(suggestedDiam_m*1000)} ملم)`;
            }
        }
        
        let sizeResultExtra = '';
        if (calcMode === 'size') {
            let suggestedWidth = Math.sqrt(resultArea);
            let suggestedHeight = suggestedWidth;
            let diam_m = 2 * Math.sqrt(resultArea / Math.PI);
            sizeResultExtra = `
                <div class="mt-3 p-2 bg-blue-50 rounded">
                    <strong> المقاس المطلوب:</strong><br>
                    مساحة المقطع = ${round4(resultArea)} م²<br>
                    مستطيل (نسبة 1:1) ≈ ${round2(suggestedWidth)} × ${round2(suggestedHeight)} م<br>
                    دائري ≈ ${Math.round(diam_m * 1000)} ملم
                </div>
            `;
        }
        
        let resultObj = {
            ' طريقة الحساب': calcMode === 'velocity' ? 'حساب السرعة من الأبعاد' : 'حساب المقاس من السرعة المطلوبة',
            ' معدل التدفق': `${round0(cfm)} CFM (${round0(flow)} ${flowUnit === 'cfm' ? 'CFM' : 'm³/h'})`,
            'نوع المشروع / الهواء': `${projectType === 'res' ? 'سكني' : projectType === 'com' ? 'تجاري' : 'صناعي'} / ${airType === 'supply' ? 'Supply' : airType === 'return' ? 'Return' : 'Exhaust'}`,
            ' مساحة المقطع (م²)': round4(areaM2),
            ' شكل الدكت': ductShape === 'rect' ? 'مستطيل' : 'دائري',
        };
        
        if (hydraulicDiameter !== null && hydraulicDiameter > 0) {
            resultObj[' القطر الهيدروليكي (م)'] = round3(hydraulicDiameter);
        }
        
        resultObj[' السرعة'] = `${round2(velocity_ms)} م/ث   |   ${round0(velocity_ms * 196.85)} قدم/دقيقة`;
        resultObj[' التوصية'] = recommendation;
        if (noiseWarning) resultObj[' تحذير الضوضاء'] = noiseWarning;
        if (pressureWarning) resultObj[' فقد الضغط التقريبي'] = pressureWarning;
        if (smartSuggestion) resultObj['اقتراح تحسين'] = smartSuggestion;
        
        if (calcMode === 'velocity' && ductShape === 'rect') {
            let useAreaDirect = document.getElementById('av_use_area_direct').checked;
            if (!useAreaDirect) {
                let w = document.getElementById('av_width').value;
                let h = document.getElementById('av_height').value;
                if (w && h && !isNaN(parseFloat(w)) && !isNaN(parseFloat(h))) {
                    resultObj[' أبعاد الدكت'] = `${w} × ${h} م`;
                }
            }
        } else if (ductShape === 'round') {
            let d = document.getElementById('av_diameter').value;
            if (d && !isNaN(parseFloat(d))) {
                resultObj[' القطر'] = `${d} ملم`;
            }
        }
        
        function round3(v) { return Math.round(v * 1000) / 1000; }
        
        showFullRes('نتائج تصميم مجرى الهواء', resultObj, sizeResultExtra);
    });
    
    setTimeout(() => {
        const modeSelect = document.getElementById('calc_mode');
        const velocitySection = document.getElementById('mode_velocity_section');
        const sizeSection = document.getElementById('mode_size_section');
        const roundSection = document.getElementById('round_dim_section');
        const ductShape = document.getElementById('duct_shape');
        const useAreaCheckbox = document.getElementById('av_use_area_direct');
        const dimDiv = document.getElementById('av_dimensions_div');
        const areaDiv = document.getElementById('av_area_div');
        
        if (modeSelect) {
            const toggleMode = () => {
                if (modeSelect.value === 'velocity') {
                    velocitySection.style.display = 'block';
                    sizeSection.style.display = 'none';
                } else {
                    velocitySection.style.display = 'none';
                    sizeSection.style.display = 'block';
                }
                clearResult();
            };
            modeSelect.addEventListener('change', toggleMode);
            toggleMode();
        }
        
        if (ductShape) {
            const toggleRound = () => {
                roundSection.style.display = (ductShape.value === 'round') ? 'block' : 'none';
                clearResult();
            };
            ductShape.addEventListener('change', toggleRound);
            toggleRound();
        }
        
        if (useAreaCheckbox && dimDiv && areaDiv) {
            const toggleAreaDimensions = () => {
                if (useAreaCheckbox.checked) {
                    dimDiv.style.display = 'none';
                    areaDiv.style.display = 'block';
                } else {
                    dimDiv.style.display = 'block';
                    areaDiv.style.display = 'none';
                }
                clearResult();
            };
            useAreaCheckbox.addEventListener('change', toggleAreaDimensions);
            toggleAreaDimensions();
        }
        
        const inputs = ['av_flow', 'av_flow_unit', 'project_type', 'av_air_type', 'duct_shape', 'av_width', 'av_height', 'av_area', 'av_area_unit', 'av_diameter', 'target_velocity'];
        inputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('input', clearResult);
        });
    }, 50);
    return;
}

else if (toolId === 'pressure_diagnosis') {
    title.innerText = ' تشخيص الضغوط والكهرباء';
    const refrigerants = Object.keys(refPTData);
    
    const refLimits = {
        'R22': { ratioHigh: 5.5, ratioVeryHigh: 6.2 },
        'R410A': { ratioHigh: 7.0, ratioVeryHigh: 8.0 },
        'R134a': { ratioHigh: 4.5, ratioVeryHigh: 5.2 },
        'R404A': { ratioHigh: 6.0, ratioVeryHigh: 7.0 },
        'R407C': { ratioHigh: 5.8, ratioVeryHigh: 6.8 },
        'R32': { ratioHigh: 7.2, ratioVeryHigh: 8.2 }
    };
    
    const getRefLimits = (ref) => refLimits[ref] || { ratioHigh: 6.0, ratioVeryHigh: 7.0 };
    
    const generateReport = (ref, values, systemType) => {
        const { suction, discharge, ambient, suctionTemp, liquidTemp, current, rla } = values;
        const evapTemp = getTempFromPressure(ref, suction);
        const condTemp = getTempFromPressure(ref, discharge);
        if (isNaN(evapTemp) || isNaN(condTemp)) return null;
        
        const superheat = suctionTemp - evapTemp;
        const subcool = condTemp - liquidTemp;
        const condSplit = condTemp - ambient;
        const pressureRatio = discharge / suction;
        const pressureDiff = discharge - suction;
        
        const limits = getRefLimits(ref);
        
        let diagnoses = [];
        
        if (pressureRatio > limits.ratioVeryHigh && superheat > 12 && subcool < 3 && suction < 60) {
            diagnoses.push({ text: 'نقص حاد في شحنة الفريون', weight: 10, reasons: ['نسبة ضغط عالية جداً + حرارة محمصة مرتفعة + تبريد تحت التبريد شبه معدوم'], steps: ['كشف تسريب الفريون بالكاشف أو الصابون، إصلاح التسريب، ثم شحن النظام حسب الكتالوج'] });
        }
        else if (pressureRatio > limits.ratioHigh && superheat > 8 && subcool < 5 && suction < 65) {
            diagnoses.push({ text: ' نقص شحنة فريون (متوسط)', weight: 8, reasons: ['نسبة ضغط مرتفعة، حرارة محمصة مرتفعة، تبريد تحت تبريد منخفض'], steps: ['فحص خط السائل هل به فقاعات؟ أضف فريون تدريجياً حتى تختفي الفقاعات'] });
        }
        else if (subcool > 15 && superheat < 4 && pressureDiff > 250) {
            diagnoses.push({ text: 'زيادة شحنة الفريون (زيادة مفرطة)', weight: 9, reasons: ['تبريد تحت التبريد مرتفع جداً، حرارة محمصة منخفضة - خطر رجوع سائل'], steps: ['تفريغ جزء من الشحنة تدريجياً حتى يصبح Subcool بين 8-12 وسوبرهيت 5-8'] });
        }
        else if (subcool > 12 && superheat < 6) {
            diagnoses.push({ text: ' زيادة طفيفة في الشحنة', weight: 6, reasons: ['زيادة الشحنة تؤدي إلى انخفاض السوبرهيت ورفع ضغط الطرد'], steps: ['تفريغ بسيط (5-10%) وإعادة قياس السوبرهيت'] });
        }
        
        if (systemType === 'capillary') {
            if (pressureRatio < 2.8 && superheat > 18 && subcool > 12 && suction < 40) {
                diagnoses.push({ text: ' انسداد شبه كامل في الأنبوبة الشعرية أو فلتر الدراير', weight: 10, reasons: ['ضغط سحب منخفض جداً، حرارة محمصة عالية، تبريد تحت تبريد مرتفع'], steps: ['تفقد الفلتر دراير - إذا كان بارداً من جهة وساخناً من أخرى فهو مسدود، استبدله مع تنظيف الأنبوبة'] });
            }
            else if (pressureRatio < 3.2 && superheat > 14 && subcool > 10) {
                diagnoses.push({ text: ' انسداد جزئي في الكابلري أو الفلتر', weight: 8, reasons: ['نسبة ضغط منخفضة نسبياً مع سوبرهيت عالي وسوبكول متوسط إلى مرتفع'], steps: ['قياس درجة حرارة الفلتر دراير - فارق حرارة > 3°C يدل على انسداد، غيّره'] });
            }
        } else {
            if (superheat < 2 && subcool > 14 && pressureDiff > 220) {
                diagnoses.push({ text: ' صمام تمدد حراري TXV عالق في وضع مفتوح بالكامل أو حساسه منفصل', weight: 9, reasons: ['سوبرهيت شبه معدوم (خطر رجوع سائل) مع سوبكول مرتفع'], steps: ['افحص حساس TXV، نظف رأس الصمام، إذا لم يتحسن فاستبدل الصمام'] });
            }
            else if (superheat > 25 && subcool < 6 && pressureRatio > limits.ratioHigh) {
                diagnoses.push({ text: 'صمام تمدد TXV عالق في وضع مغلق أو شبكة الحساس مسدودة', weight: 9, reasons: ['سوبرهيت عالٍ جداً وسوبكول منخفض'], steps: ['افحص ضبط TXV، تأكد من عدم وجود هواء في الحساس، غطِّ الحساس بيدك - يجب أن يزيد التدفق'] });
            }
        }
        
        if (evapTemp < -5 && superheat < 4) {
            diagnoses.push({ text: ' تجمد المبخر بسبب ضعف تدفق الهواء أو عطل مروحة', weight: 8, reasons: [`درجة تبخير ${evapTemp.toFixed(1)}°C أقل من نقطة التجمد وسوبرهيت منخفض جداً`], steps: ['نظف فلتر الهواء، تأكد من عمل المروحة، ارفع الإعداد الحراري مؤقتاً'] });
        }
        else if (evapTemp > 12 && superheat < 4 && suction > 70) {
            diagnoses.push({ text: ' حمل حراري عالٍ جداً على المبخر (غاز ساخن عائد)', weight: 7, reasons: ['درجة تبخير مرتفعة (>12°C) وسوبرهيت شبه منخفض'], steps: ['تأكد من عدم وجود فتحات تهوية غريبة، فحص حجم المبخر'] });
        }
        
        if (condSplit > 20) {
            diagnoses.push({ text: 'مكثف متسخ أو مروحة ضعيفة (اتساخ شديد)', weight: 8, reasons: [`فرق حرارة التكثيف ${condSplit.toFixed(1)}°C > 20 (طبيعي <15)`], steps: ['نظف المكثف بالماء والضغط، وتأكد من دوران المروحة بالاتجاه الصحيح'] });
        }
        else if (condSplit > 15) {
            diagnoses.push({ text: ' بداية اتساخ المكثف أو ضعف طفيف في المراوح', weight: 5, reasons: [`فرق حرارة التكثيف ${condSplit.toFixed(1)}°C بين 15 و20`], steps: ['افحص نظافة المكثف، اختبر تيار المروحة'] });
        }
        
        if ((suction > 75 && discharge < 180) || (pressureRatio < 2.5 && discharge < 170)) {
            diagnoses.push({ text: ' ضعف كفاءة الضاغط (تآكل الصمامات الداخلية)', weight: 9, reasons: ['ضغط سحب مرتفع وضغط طرد منخفض - لا يبني فرق ضغط كاف'], steps: ['افحص الضاغط عن طريق اختبار الأمبير والمقارنة مع RLA، قياس ضغط الزيت، استبدل الضاغط إذا لزم الأمر'] });
        }
        
        if (!isNaN(rla) && rla > 0) {
            if (current > rla * 1.25) {
                if (condTemp > 50) {
                    diagnoses.push({ text: ' تيار مرتفع جداً بسبب ارتفاع ضغط الطرد (مكثف متسخ أو شحن زائد)', weight: 9, reasons: [`التيار ${current}A > 125% RLA ودرجة تكثيف ${condTemp.toFixed(1)}°C مرتفعة`], steps: ['نظف المكثف، تفقد شحنة الفريون'] });
                } else {
                    diagnoses.push({ text: ' تيار مرتفع جداً (احتمال تلف ميكانيكي أو كهربائي)', weight: 9, reasons: [`التيار ${current}A يتجاوز 125% من RLA (${rla}A)`], steps: ['افحص مكثف التشغيل، مقاومة اللفات، قد يكون الضاغط عالقاً أو تيار عدم توازن'] });
                }
            }
            else if (current > rla * 1.1) {
                diagnoses.push({ text: ' تيار مرتفع بشكل ملحوظ', weight: 6, reasons: ['حمل زائد على الضاغط أو ضعف التبريد'], steps: ['افحص ضغوط الطرد، نظف المكثف، قم بقياس الجهد عند التشغيل'] });
            }
            else if (current < rla * 0.5) {
                diagnoses.push({ text: ' تيار منخفض جداً (احتمال ضعف الضاغط أو نقص شحنة شديد)', weight: 7, reasons: ['التيار أقل من 50% من RLA'], steps: ['تحقق من وجود فريون كافٍ، قد يكون الضاغط لا يضغط إلا قليلاً'] });
            }
        }
        
        if (discharge > 400 && subcool > 18 && condSplit > 25) {
            diagnoses.push({ text: 'وجود هواء أو غازات غير قابلة للتكثيف في الدائرة', weight: 9, reasons: ['ضغط طرد مرتفع جداً مع سوبكول عالي وفرق تكثيف كبير'], steps: ['قم بتفريغ النظام بالكامل، عمل فاكيوم عميق، ثم إعادة شحن الفريون'] });
        }
        if (subcool > 20 && pressureRatio > limits.ratioHigh && superheat < 3) {
            diagnoses.push({ text: ' رطوبة في الدائرة (تتجمد في صمام التمدد)', weight: 8, reasons: ['سوبرهيت يتذبذب وسوبكول مرتفع - مؤشر على تجمد جزئي'], steps: ['استبدل فلتر الدراير بآخر مزيل رطوبة، ثم فاكيوم طويل'] });
        }
        
        if (suction < 25 && superheat > 18 && (condTemp - ambient) < 12) {
            diagnoses.push({ text: ' ضعف تدفق الهواء على المبخر أو مبخر متجمد', weight: 7, reasons: ['ضغط سحب منخفض + سوبرهيت مرتفع + تكثيف طبيعي'], steps: ['افحص مراوح المبخر، ازالة الجليد، تنظيف الفلاتر'] });
        }
        
        if (current > 0 && (suction > 50 && discharge > 200 && pressureRatio < 4.5 && superheat > 8 && subcool < 6)) {
            diagnoses.push({ text: ' عدم توازن الفازات (ثلاثة فاز) أو انخفاض الجهد', weight: 7, reasons: ['ضغوط شبه طبيعية لكن التيار مرتفع'], steps: ['قياس الفولت بين الفازات، يجب ألا يزيد الفرق عن 2%، تحسين التغذية الكهربائية'] });
        }
        
        if (discharge - suction < 70 && discharge > 150 && suction > 50) {
            diagnoses.push({ text: ' خلل في صمام الانعكاس (رباعي الاتجاه)', weight: 8, reasons: ['فرق ضغط منخفض بين الطرد والسحب على الرغم من وجود ضغوط متوسطة'], steps: ['اختبر الصمام بالقرع عليه، قد يكون عالقاً، بدّل ملف الصمام أو الصمام نفسه'] });
        }
        
        if (diagnoses.length === 0) {
            diagnoses.push({ text: ' النظام يعمل بشكل طبيعي', weight: 0, reasons: ['جميع القراءات ضمن النطاقات الطبيعية'], steps: ['لا توجد إجراءات مطلوبة، يمكن إجراء صيانة دورية'] });
        }
        
        diagnoses.sort((a, b) => b.weight - a.weight);
        const top = diagnoses[0];
        const otherDiags = diagnoses.slice(1).map(d => d.text).filter(t => t !== top.text);
        
        return {
            evapTemp, condTemp, condSplit, superheat, subcool, pressureDiff,
            topDiagnosis: top.text,
            topReasons: top.reasons.join('; '),
            topSteps: top.steps.join('; '),
            otherDiagnoses: otherDiags.length ? otherDiags.join(' | ') : 'لا يوجد',
            pressureRatio
        };
    };
    
    const performDiagnosis = () => {
        const ref = document.getElementById('diag_ref').value;
        const systemType = document.getElementById('diag_system_type').value;
        const suction = parseFloat(document.getElementById('diag_suction').value);
        const discharge = parseFloat(document.getElementById('diag_discharge').value);
        const ambient = parseFloat(document.getElementById('diag_ambient').value);
        const suctionTemp = parseFloat(document.getElementById('diag_suctionTemp').value);
        const liquidTemp = parseFloat(document.getElementById('diag_liquidTemp').value);
        const current = parseFloat(document.getElementById('diag_current').value);
        const rla = parseFloat(document.getElementById('diag_rla').value);
        
        if ([suction, discharge, ambient, suctionTemp, liquidTemp, current].some(isNaN)) {
            showToast('أدخل جميع القيم الأساسية بشكل صحيح', 'warning');
            return;
        }
        if (discharge <= suction) {
            showToast('خطأ: ضغط الطرد يجب أن يكون أعلى من ضغط السحب', 'error');
            return;
        }
        if (!refPTData[ref]) {
            showToast('بيانات الفريون غير متوفرة', 'error');
            return;
        }
        
        const result = generateReport(ref, { suction, discharge, ambient, suctionTemp, liquidTemp, current, rla }, systemType);
        if (!result) {
            showToast('ضغوط خارج نطاق الفريون', 'error');
            return;
        }
        
        const resultObj = {
            'تنبيه': 'هذا التشخيص استرشادي قد لا يكون دقيقاً بنسبة 100%، يُفضل استخدامه كمرجع أولي.',
            'الفريون': ref,
            'اداة التمدد': systemType === 'txv' ? 'TXV' : 'كابلري',
            'ضغط السحب (PSI)': suction.toFixed(1),
            'ضغط الطرد (PSI)': discharge.toFixed(1),
            'نسبة الضغط': result.pressureRatio.toFixed(2),
            'درجة التبخير (محسوبة)': result.evapTemp.toFixed(1) + ' °C',
            'درجة التكثيف (محسوبة)': result.condTemp.toFixed(1) + ' °C',
            'فرق حرارة التكثيف': result.condSplit.toFixed(1) + ' °C',
            'Superheat (حرارة محمصة)': result.superheat.toFixed(1) + ' °C',
            'Subcooling (تبريد تحت تبريد)': result.subcool.toFixed(1) + ' °C',
            'فرق ضغط (طرد - سحب)': result.pressureDiff.toFixed(1) + ' PSI',
            'تيار الضاغط': current.toFixed(1) + ' A' + (rla > 0 ? ` (RLA=${rla})` : ''),
            ' التشخيص الرئيسي': result.topDiagnosis,
            ' الأسباب المحتملة': result.topReasons,
            ' الإجراءات والحلول': result.topSteps
        };
        
        if (result.otherDiagnoses !== 'لا يوجد') {
            resultObj['تشخيصات أخرى محتملة'] = result.otherDiagnoses;
        }
        
        showFullRes(' تقرير تشخيص ضغوط وكهرباء النظام', resultObj);
    };
    
    document.getElementById('modalBody').innerHTML = `
        <div class="grid gap-3" dir="rtl">
            <div class="flex flex-wrap gap-3">
                <div class="flex-1 min-w-[130px]"><label class="block text-sm font-semibold">نوع الفريون</label><select id="diag_ref">${refrigerants.map(r=>`<option value="${r}">${r}</option>`).join('')}</select></div>
                <div class="flex-1 min-w-[130px]"><label class="block text-sm font-semibold">اداة التمدد</label><select id="diag_system_type"><option value="capillary">كابلري </option><option value="txv">صمام تمدد TXV</option></select></div>
            </div>
            <div class="flex flex-wrap gap-3">
                <div class="flex-1 min-w-[100px]"><label class="block text-sm font-semibold">ضغط السحب (PSI)</label><input type="number" step="any" id="diag_suction" value="60"></div>
                <div class="flex-1 min-w-[100px]"><label class="block text-sm font-semibold">ضغط الطرد (PSI)</label><input type="number" step="any" id="diag_discharge" value="220"></div>
            </div>
            <div class="flex flex-wrap gap-3">
                <div class="flex-1 min-w-[100px]"><label class="block text-sm font-semibold">حرارة الجو (°C)</label><input type="number" step="any" id="diag_ambient" value="35"></div>
                <div class="flex-1 min-w-[100px]"><label class="block text-sm font-semibold">خط السحب (°C)</label><input type="number" step="any" id="diag_suctionTemp" value="15"></div>
                <div class="flex-1 min-w-[100px]"><label class="block text-sm font-semibold">خط السائل (°C)</label><input type="number" step="any" id="diag_liquidTemp" value="40"></div>
            </div>
            <div class="flex flex-wrap gap-3">
                <div class="flex-1 min-w-[100px]"><label class="block text-sm font-semibold">تيار الضاغط (A)</label><input type="number" step="any" id="diag_current" value="8"></div>
                <div class="flex-1 min-w-[130px]"><label class="block text-sm font-semibold">RLA (اختياري)</label><input type="number" step="any" id="diag_rla" placeholder="مثل 10.5"></div>
            </div>
        </div>
    `;
    
    document.getElementById('resultDisplay').classList.add('hidden');
    const inputs = document.querySelectorAll('#modalBody input, #modalBody select');
    inputs.forEach(input => {
        input.removeEventListener('input', clearResult);
        input.removeEventListener('change', clearResult);
        input.addEventListener('input', clearResult);
        input.addEventListener('change', clearResult);
    });
    
    if (calcBtn) {
        calcBtn.onclick = null;
        calcBtn.onclick = () => withLoading(calcBtn, performDiagnosis);
        calcBtn.style.display = 'flex';
    }
    return;
}

else if (toolId === 'ventilation') {
    title.innerText = ' حساب التهوية وتحديد سعة المراوح ';
    
    const M3H_TO_CFM = 0.588577;
    const DEFAULT_FAN_EFF = 0.65;
    const STANDARD_AIR_DENSITY_20C = 1.204;
    const SYSTEM_EFFECT_FACTOR = 1.1;
    const PRESSURE_MARGIN = 20;
    
    const SPACE_TYPES = TOOL_CONSTANTS.spaceTypes;
    const FILTER_LOSS_RANGE = TOOL_CONSTANTS.filterLossRange;
    const DUCT_FRICTION_FACTOR = TOOL_CONSTANTS.ductFrictionFactor;
    const ASSUMED_VELOCITY_BY_CATEGORY = TOOL_CONSTANTS.assumedVelocityByCategory;
    
    let activeMode = 'simple';
    
    function calculateVolume(length, width, height) {
        if (isNaN(length) || isNaN(width) || isNaN(height)) return NaN;
        return length * width * height;
    }
    
    function calculateAirflow(volume_m3, ach) {
        if (volume_m3 <= 0 || ach <= 0) return NaN;
        return volume_m3 * ach;
    }
    
    function getAirDensity(tempCelsius) {
        if (isNaN(tempCelsius)) return STANDARD_AIR_DENSITY_20C;
        let density = 1.204 - (tempCelsius - 20) * 0.004;
        return Math.max(density, 1.05);
    }
    
    function getAssumedVelocityBySpace(spaceTypeKey) {
        if (spaceTypeKey && SPACE_TYPES[spaceTypeKey]) {
            let cat = SPACE_TYPES[spaceTypeKey].category;
            return ASSUMED_VELOCITY_BY_CATEGORY[cat] || 4.0;
        }
        return 4.0;
    }
    
    function calculateDuctLoss(flow_m3h, ductDiameter_mm, ductLength_m, ductType, rho) {
        if (ductLength_m <= 0 || ductDiameter_mm <= 0) return 0;
        let Q_m3s = flow_m3h / 3600;
        let D_m = ductDiameter_mm / 1000;
        let area_m2 = Math.PI * D_m * D_m / 4;
        let velocity = Q_m3s / area_m2;
        if (velocity <= 0) return 0;
        
        let f = DUCT_FRICTION_FACTOR[ductType] || 0.02;
        let dp = f * (ductLength_m / D_m) * (rho * velocity * velocity / 2);
        return Math.max(dp, 0);
    }
    
    function calculateElbowLoss(elbowsCount, velocity_m_s, ductType, rho) {
        if (elbowsCount <= 0) return 0;
        let K_elbow = (ductType === 'flexible') ? 1.2 : 0.75;
        let dynamicPressure = 0.5 * rho * velocity_m_s * velocity_m_s;
        return elbowsCount * K_elbow * dynamicPressure;
    }
    
    function calculateAdvancedParams(Q_m3h_safe, ductLength_m, ductDiameter_mm, elbowsCount, filterValue, ductType, spaceTypeKey, ambientTemp) {
        let Q_m3s = Q_m3h_safe / 3600;
        let rho = getAirDensity(ambientTemp);
        
        let velocity = 0;
        let usedDiameter = ductDiameter_mm;
        if (usedDiameter > 0) {
            let area_m2 = Math.PI * Math.pow(usedDiameter/1000, 2) / 4;
            velocity = Q_m3s / area_m2;
        } else {
            let assumedVel = getAssumedVelocityBySpace(spaceTypeKey);
            let assumedArea = Q_m3s / assumedVel;
            let assumedDiameter_mm = Math.sqrt(assumedArea * 4 / Math.PI) * 1000;
            usedDiameter = assumedDiameter_mm;
            velocity = assumedVel;
        }
        
        let ductLoss = calculateDuctLoss(Q_m3h_safe, usedDiameter, ductLength_m, ductType, rho);
        let elbowLoss = calculateElbowLoss(elbowsCount, velocity, ductType, rho);
        let filterLoss = filterValue;
        let staticPressure = ductLoss + elbowLoss + filterLoss + PRESSURE_MARGIN;
        staticPressure = Math.max(staticPressure, 0);
        let fanPowerWatts = (staticPressure * Q_m3s) / DEFAULT_FAN_EFF;
        fanPowerWatts = fanPowerWatts * SYSTEM_EFFECT_FACTOR;
        
        return { staticPressure, fanPowerWatts, velocity, ductLoss, elbowLoss, usedDiameter };
    }
    
    function recommendFanType(Q_m3h, staticPressure_Pa) {
        let Q_m3s = Q_m3h / 3600;
        if (staticPressure_Pa < 60) {
            return "محورية (Axial) - مناسبة للضغوط المنخفضة والتهوية العامة";
        } else if (staticPressure_Pa < 150) {
            if (Q_m3s < 1.5) return "محورية عالية الضغط أو خلاطة (Mixed Flow)";
            else return "طرد مركزي (Centrifugal) خلفي الميلان (Backward Curved)";
        } else if (staticPressure_Pa < 350) {
            return "طرد مركزي (Centrifugal) أمامي الميلان (Forward Curved)";
        } else {
            return "طرد مركزي (Centrifugal) عالي الضغط - قد يحتاج تصميم خاص";
        }
    }
    
    const calculateVentilation = () => {
        let length = parseFloat(document.getElementById('vent_length')?.value);
        let width = parseFloat(document.getElementById('vent_width')?.value);
        let height = parseFloat(document.getElementById('vent_height')?.value);
        let useVolumeDirect = document.getElementById('vent_use_volume')?.checked || false;
        let volume = 0;
        
        if (useVolumeDirect) {
            volume = parseFloat(document.getElementById('vent_volume')?.value);
            if (isNaN(volume) || volume <= 0) {
                showToast('أدخل حجماً صحيحاً للمكان (أكبر من 0)', 'warning');
                return;
            }
        } else {
            if (isNaN(length) || isNaN(width) || isNaN(height) || length <= 0 || width <= 0 || height <= 0) {
                showToast('أدخل أبعاداً صحيحة (أكبر من 0)', 'warning');
                return;
            }
            volume = calculateVolume(length, width, height);
        }
        
        let spaceType = document.getElementById('vent_space_type')?.value;
        let achMode = document.querySelector('input[name="vent_ach_mode"]:checked')?.value;
        let ach = 0;
        if (achMode === 'auto' && spaceType && SPACE_TYPES[spaceType]) {
            ach = SPACE_TYPES[spaceType].default_ach;
        } else {
            ach = parseFloat(document.getElementById('vent_ach_manual')?.value);
            if (isNaN(ach) || ach <= 0) {
                showToast('أدخل عدد مرات تغيير الهواء (ACH) الصحيح', 'warning');
                return;
            }
        }
        
        let safety = parseFloat(document.getElementById('vent_safety')?.value);
        if (isNaN(safety) || safety < 1.0) safety = 1.0;
        if (safety > 1.5) safety = 1.5;
        
        let ambientTemp = parseFloat(document.getElementById('vent_ambient_temp')?.value);
        if (isNaN(ambientTemp)) ambientTemp = 20;
        ambientTemp = Math.min(Math.max(ambientTemp, -10), 50);
        
        let mode = document.querySelector('#modalBody .phase-option.selected[data-vent-mode]')?.dataset.ventMode || 'simple';
        
        let Q_m3h = calculateAirflow(volume, ach);
        if (isNaN(Q_m3h) || Q_m3h <= 0) {
            showToast('قيم غير صالحة للحساب', 'error');
            return;
        }
        let Q_cfm = Q_m3h * M3H_TO_CFM;
        
        let Q_safe_m3h = Q_m3h * safety;
        let Q_safe_cfm = Q_safe_m3h * M3H_TO_CFM;
        
        let results = {
            'حجم المكان': `${volume.toFixed(2)} m³`,
            'عدد مرات تغيير الهواء (ACH)': ach.toFixed(2),
            'معدل الهواء المطلوب (m³/h)': Q_m3h.toFixed(0),
            'معدل الهواء المطلوب (CFM)': Q_cfm.toFixed(0),
            'معامل الأمان': safety.toFixed(2),
            'سعة المروحة بعد الأمان (m³/h)': Q_safe_m3h.toFixed(0),
            'سعة المروحة بعد الأمان (CFM)': Q_safe_cfm.toFixed(0)
        };
        
        let warnings = [];
        if (spaceType && SPACE_TYPES[spaceType]) {
            let minAch = SPACE_TYPES[spaceType].ach_min;
            let maxAch = SPACE_TYPES[spaceType].ach_max;
            if (ach < minAch) warnings.push(` ACH (${ach}) أقل من الموصى به لنوع "${SPACE_TYPES[spaceType].name}" (${minAch}-${maxAch}) – تهوية غير كافية.`);
            else if (ach > maxAch) warnings.push(` ACH (${ach}) أعلى من الموصى به لنوع "${SPACE_TYPES[spaceType].name}" (${minAch}-${maxAch}) – استهلاك طاقة كبير.`);
        }
        
        if (mode === 'advanced') {
            let ductLength = parseFloat(document.getElementById('vent_duct_length')?.value) || 0;
            let ductDiameter = parseFloat(document.getElementById('vent_duct_diameter')?.value) || 0;
            let elbows = parseInt(document.getElementById('vent_elbows')?.value) || 0;
            let filterType = document.getElementById('vent_filter')?.value || 'none';
            let filterManual = parseFloat(document.getElementById('vent_filter_manual')?.value);
            let ductType = document.getElementById('vent_duct_type')?.value || 'rigid';
            
            if (ductLength < 0) ductLength = 0;
            if (elbows < 0) elbows = 0;
            
            let filterValue = 0;
            if (filterType === 'manual' && !isNaN(filterManual) && filterManual >= 0) {
                filterValue = filterManual;
            } else {
                let range = FILTER_LOSS_RANGE[filterType] || FILTER_LOSS_RANGE.none;
                filterValue = range.default;
            }
            
            let adv = calculateAdvancedParams(Q_safe_m3h, ductLength, ductDiameter, elbows, filterValue, ductType, spaceType, ambientTemp);
            let fanType = recommendFanType(Q_safe_m3h, adv.staticPressure);
            let airDensity = getAirDensity(ambientTemp);
            
            results['درجة حرارة الهواء'] = `${ambientTemp}°C`;
            results['كثافة الهواء المستخدمة'] = `${airDensity.toFixed(3)} kg/m³`;
            results['طول مجرى الهواء (م)'] = ductLength.toFixed(1);
            results['قطر الدكت (مم)'] = (ductDiameter > 0) ? ductDiameter.toFixed(0) : `${adv.usedDiameter.toFixed(0)} (مُقدَّر)`;
            results['القطر المقترح للدكت (مم)'] = adv.usedDiameter.toFixed(0);
            results['سرعة الهواء الفعلية (م/ث)'] = adv.velocity.toFixed(2);
            results['عدد الأكواع'] = elbows;
            results['نوع الدكت'] = ductType === 'rigid' ? 'صاج صلب' : 'فليكس (مرن)';
            results['معامل الاحتكاك (f) المستخدم'] = (ductType === 'rigid') ? '0.02' : '0.04';
            results['معامل خسارة الكوع (K)'] = (ductType === 'flexible') ? '1.2' : '0.75';
            results['نوع الفلتر'] = (filterType === 'manual') ? `يدوي (${filterValue} Pa)` : (filterType === 'none' ? 'بدون' : (filterType === 'standard' ? 'عادي' : 'HEPA'));
            results['فقد ضغط الفلتر (Pa)'] = filterValue.toFixed(0);
            results['فقد ضغط المجرى (Pa)'] = adv.ductLoss.toFixed(0);
            results['فقد ضغط الأكواع (Pa)'] = adv.elbowLoss.toFixed(0);
            results['هامش الضغط الاحتياطي (Pa)'] = `${PRESSURE_MARGIN} (للتسخ أو زيادة الفواقد)`;
            results['الضغط الاستاتيكي الكلي (Pa)'] = adv.staticPressure.toFixed(0);
            results['القدرة التقريبية للمروحة (واط)'] = adv.fanPowerWatts.toFixed(0);
            results['نوع المروحة الموصى به'] = fanType;
            
            if (ductLength > 30 && adv.usedDiameter < 200) {
                warnings.push(` طول الدكت كبير (${ductLength} م) مع قطر صغير (${adv.usedDiameter.toFixed(0)} مم) → فقد ضغط عالي جدًا، يفضل زيادة القطر إلى ${Math.min(Math.round(adv.usedDiameter * 1.3), 500)} مم على الأقل.`);
            }
            
            let recVel = getAssumedVelocityBySpace(spaceType);
            if (adv.velocity < recVel * 0.7) warnings.push(` سرعة الهواء (${adv.velocity.toFixed(1)} م/ث) أقل من المثالية لنوع المكان (~${recVel} م/ث) – قد تحتاج قطر أصغر.`);
            if (adv.velocity > recVel * 1.5) warnings.push(` سرعة الهواء (${adv.velocity.toFixed(1)} م/ث) أعلى من المثالية لنوع المكان (~${recVel} م/ث) – ضوضاء وفقد ضغط كبير.`);
            if (adv.staticPressure > 400) warnings.push(' ضغط مرتفع جداً (>400 Pa) – يفضل استخدام مروحة طرد مركزي مع مجاري أكبر قطراً.');
            if (adv.fanPowerWatts > 5000) warnings.push(' قدرة المروحة عالية جداً (>5kW) – راجع تصميم التهوية.');
        }
        
        if (warnings.length > 0) {
            results['تحذيرات وتوصيات'] = warnings.join(' | ');
        } else {
            results[' الحالة'] = 'جميع القيم ضمن النطاقات الموصى بها.';
        }
        
        showFullRes(' نتائج حساب التهوية والمروحة (Pro Max v2)', results);
    };
    
    const renderUI = () => {
        const isAdvanced = (activeMode === 'advanced');
        const spaceTypesOptions = Object.entries(SPACE_TYPES).map(([key, val]) => 
            `<option value="${key}">${val.name} (${val.ach_min}-${val.ach_max} ACH)</option>`
        ).join('');
        
        let html = `
            <div class="flex gap-2 mb-3 border-b pb-2">
                <button id="ventModeSimple" class="tab-btn ${!isAdvanced ? 'active' : ''}" data-vent-mode="simple"> وضع سريع (ACH فقط)</button>
                <button id="ventModeAdvanced" class="tab-btn ${isAdvanced ? 'active' : ''}" data-vent-mode="advanced"> وضع متقدم </button>
            </div>
            
            <div class="space-y-3">
                <div class="flex items-center gap-2">
                    <input type="checkbox" id="vent_use_volume" class="inpchk"/>
                    <label>إدخال الحجم مباشرة</label>
                </div>
                
                <div id="vent_dimensions_div">
                    <div class="flex gap-2">
                        <div class="flex-1"><label>الطول (م)</label><input type="number" step="any" id="vent_length" value="5" class="w-full"></div>
                        <div class="flex-1"><label>العرض (م)</label><input type="number" step="any" id="vent_width" value="4" class="w-full"></div>
                        <div class="flex-1"><label>الارتفاع (م)</label><input type="number" step="any" id="vent_height" value="3" class="w-full"></div>
                    </div>
                </div>
                
                <div id="vent_volume_div" style="display:none;">
                    <label>حجم المكان (m³)</label>
                    <input type="number" step="any" id="vent_volume" class="w-full">
                </div>
                
                <div>
                    <label>قيم ACH حسب المكان </label>
                    <select id="vent_space_type" class="w-full">
                        <option value="">-- اختر نوع المكان (إن أردت) --</option>
                        ${spaceTypesOptions}
                    </select>
                </div>
                
                <div>
                    <label>طريقة إدخال ACH (عدد مرات تغيير الهواء في الساعة)</label>
                    <div class="flex gap-2">
                        <label class="flex-1 text-center"><input type="radio" name="vent_ach_mode" class="inpchk" value="auto" checked> تلقائي</label>
                        <label class="flex-1 text-center"><input type="radio" name="vent_ach_mode" class="inpchk" value="manual"> إدخال يدوي</label>
                    </div>
                    <div id="vent_ach_manual_container" style="display: none;">
                        <input type="number" step="any" id="vent_ach_manual" placeholder="أدخل ACH يدوياً" class="w-full mt-1">
                    </div>
                </div>
                
                <div>
                    <label>معامل الأمان (يطبق على التدفق فقط - 1.0 إلى 1.5)</label>
                    <input type="number" step="0.05" id="vent_safety" value="1.1" class="w-full">
                </div>
        `;
        
        if (isAdvanced) {
            html += `
                <div class="border-t pt-2 mt-2">
                    <h4 class="font-bold text-sm">معاملات الفواقد الديناميكية </h4>
                    <label>درجة حرارة الهواء المحيطة (°C)</label>
                    <input type="number" step="any" id="vent_ambient_temp" value="20" class="w-full">
                    
                    <label>طول مجرى الهواء (متر)</label>
                    <input type="number" step="any" id="vent_duct_length" value="15" class="w-full">
                    
                    <label>قطر الدكت (مم) - يفضل إدخاله للدقة</label>
                    <input type="number" step="any" id="vent_duct_diameter" value="250" placeholder="مثال: 250 مم" class="w-full">
                                        
                    <label>نوع الدكت</label>
                    <select id="vent_duct_type" class="w-full">
                        <option value="rigid">صاج مجلفن (Rigid) - f=0.02, K=0.75</option>
                        <option value="flexible">فليكس (Flexible) - f=0.04, K=1.2</option>
                    </select>
                    
                    <label>عدد الأكواع (Elbows 90°)</label>
                    <input type="number" step="1" id="vent_elbows" value="2" class="w-full">
                    
                    <label>نوع الفلتر</label>
                    <select id="vent_filter" class="w-full">
                        <option value="none">بدون فلتر</option>
                        <option value="standard">فلتر عادي (30-80 Pa)</option>
                        <option value="hepa">HEPA (100-250 Pa)</option>
                        <option value="manual">إدخال يدوي (أدخل القيمة بالـ Pa)</option>
                    </select>
                    <div id="vent_filter_manual_div" style="display:none;">
                        <label>قيمة الفلتر (Pa)</label>
                        <input type="number" step="any" id="vent_filter_manual" placeholder="مثال: 120" class="w-full">
                    </div>
                    <div class="text-xs text-gray-500 mt-1"> تم تطبيق معامل نظام (System Effect Factor = 1.1) وهامش ضغط 20 Pa احتياطي معامل الأمان يطبق على التدفق Q فقط</div>
                </div>
            `;
        }
        
        html += `</div>`;
        setContent(html, null);
        
        setTimeout(() => {
            const useVolumeChk = document.getElementById('vent_use_volume');
            const dimDiv = document.getElementById('vent_dimensions_div');
            const volDiv = document.getElementById('vent_volume_div');
            if (useVolumeChk) {
                useVolumeChk.onchange = () => {
                    if (useVolumeChk.checked) {
                        dimDiv.style.display = 'none';
                        volDiv.style.display = 'block';
                    } else {
                        dimDiv.style.display = 'block';
                        volDiv.style.display = 'none';
                    }
                    clearResult();
                };
            }
            
            const autoRadio = document.querySelector('input[name="vent_ach_mode"][value="auto"]');
            const manualRadio = document.querySelector('input[name="vent_ach_mode"][value="manual"]');
            const manualAchContainer = document.getElementById('vent_ach_manual_container');
            const manualAchInput = document.getElementById('vent_ach_manual');
            const spaceTypeSelect = document.getElementById('vent_space_type');
            
            const updateAchMode = () => {
                if (autoRadio && autoRadio.checked) {
                    if (manualAchContainer) manualAchContainer.style.display = 'none';
                    if (spaceTypeSelect && spaceTypeSelect.value && SPACE_TYPES[spaceTypeSelect.value]) {
                        manualAchInput.value = SPACE_TYPES[spaceTypeSelect.value].default_ach;
                    } else {
                        manualAchInput.value = '';
                    }
                } else if (manualRadio && manualRadio.checked) {
                    if (manualAchContainer) manualAchContainer.style.display = 'block';
                    const currentValue = parseFloat(manualAchInput.value);
                    const autoValue = (spaceTypeSelect && spaceTypeSelect.value && SPACE_TYPES[spaceTypeSelect.value])
                                        ? SPACE_TYPES[spaceTypeSelect.value].default_ach
                                        : null;
                    if (manualAchInput.value === '' || (autoValue !== null && currentValue === autoValue)) {
                        manualAchInput.value = '';
                    }
                }
                clearResult();
            };
            
            if (autoRadio && manualRadio) {
                autoRadio.addEventListener('change', updateAchMode);
                manualRadio.addEventListener('change', updateAchMode);
            }
            if (spaceTypeSelect) {
                spaceTypeSelect.addEventListener('change', () => {
                    if (autoRadio && autoRadio.checked && spaceTypeSelect.value && SPACE_TYPES[spaceTypeSelect.value]) {
                        manualAchInput.value = SPACE_TYPES[spaceTypeSelect.value].default_ach;
                    }
                    clearResult();
                });
            }
            updateAchMode();
            
            const filterSelect = document.getElementById('vent_filter');
            const filterManualDiv = document.getElementById('vent_filter_manual_div');
            if (filterSelect && filterManualDiv) {
                filterSelect.onchange = () => {
                    filterManualDiv.style.display = (filterSelect.value === 'manual') ? 'block' : 'none';
                    clearResult();
                };
                if (filterSelect.value === 'manual') filterManualDiv.style.display = 'block';
            }
            
            const simpleBtn = document.getElementById('ventModeSimple');
            const advancedBtn = document.getElementById('ventModeAdvanced');
            if (simpleBtn && advancedBtn) {
                simpleBtn.onclick = () => {
                    activeMode = 'simple';
                    renderUI();
                };
                advancedBtn.onclick = () => {
                    activeMode = 'advanced';
                    renderUI();
                };
            }
            
            const allInputs = document.querySelectorAll('#modalBody input, #modalBody select');
            allInputs.forEach(inp => {
                inp.removeEventListener('change', clearResult);
                inp.removeEventListener('input', clearResult);
                inp.addEventListener('change', clearResult);
                inp.addEventListener('input', clearResult);
            });
            
            const calcButton = document.getElementById('calculateBtn');
            if (calcButton) {
                calcButton.style.display = 'flex';
                calcButton.onclick = () => withLoading(calcButton, calculateVentilation);
            }
        }, 30);
    };
    
    renderUI();
    return;
}
    // ========== أدوات الكهرباء ==========
    else if (toolId === 'energy') {
        title.innerText = ' تكلفة الطاقة (متقدم)';
        
        const appliances = {
            'مكيف 1.5 حصان': 1200, 'مكيف 2 حصان': 1600, 'مكيف 3 حصان': 2400,
            'ثلاجة 14 قدم': 150, 'ثلاجة 18 قدم': 200, 'فريزر': 180,
            'غسالة (تشغيل)': 500, 'غسالة (تسخين)': 2000, 'نشافة ملابس': 2500,
            'سخان كهربائي 50 لتر': 2000, 'سخان فوري': 3500, 'خلاط': 400,
            'ميكروويف': 1200, 'فرن كهربائي': 2000, 'محمصة خبز': 900,
            'غلاية كهربائية': 2000, 'مكنسة كهربائية': 800, 'مكواة': 1200,
            'تلفزيون 43 بوصة': 80, 'تلفزيون 55 بوصة': 120, 'ريسيفر': 20,
            'كمبيوتر مكتبي': 250, 'لابتوب': 60, 'شاشة كمبيوتر': 40,
            'راوتر واي فاي': 15, 'شاحن موبايل': 10, 'مروحة سقف': 70,
            'دفاية 2000 واط': 2000, 'مدفأة زيت': 1500, 'سخان مروحة': 2500,
            'لمبة LED 9 واط': 9, 'لمبة LED 12 واط': 12, 'لمبة موفرة 20 واط': 20
        };
        
        const tiers = [
            { min: 0, max: 50, price: 0.48, name: 'شريحة 1 (0-50 kWh)' },
            { min: 51, max: 100, price: 0.58, name: 'شريحة 2 (51-100 kWh)' },
            { min: 101, max: 200, price: 0.77, name: 'شريحة 3 (101-200 kWh)' },
            { min: 201, max: 350, price: 1.09, name: 'شريحة 4 (201-350 kWh)' },
            { min: 351, max: 650, price: 1.42, name: 'شريحة 5 (351-650 kWh)' },
            { min: 651, max: 1000, price: 1.57, name: 'شريحة 6 (651-1000 kWh)' },
            { min: 1001, max: Infinity, price: 1.63, name: 'شريحة 7 (أكثر من 1000 kWh)' }
        ];
        
        function round2(v) { return Math.round(v * 100) / 100; }
        
        let applianceOptions = '<option value="">-- اختر جهازاً --</option>';
        for (let [name, watt] of Object.entries(appliances)) {
            applianceOptions += `<option value="${name}">${name} (${watt} واط)</option>`;
        }
        
        const html = `
            <div class="flex gap-2 mb-3">
                <label class="flex-1">طريقة الإدخال</label>
                <select id="input_method" class="flex-1">
                    <option value="appliance">اختيار جهاز من القائمة</option>
                    <option value="manual">إدخال القدرة يدوياً</option>
                </select>
            </div>

            <div id="appliance_section">
                <label> نوع الجهاز</label>
                <select id="appliance_select" class="w-full">${applianceOptions}</select>
            </div>

            <div id="manual_section" style="display:none">
                <label> القدرة (واط)</label>
                <div class="flex gap-2">
                    <input type="number" step="any" id="en_w" value="1000" class="flex-1">
                    <select id="power_unit" class="w-1/3">
                        <option value="w">واط (W)</option>
                        <option value="kw">كيلوواط (kW)</option>
                        <option value="hp">حصان (HP)</option>
                    </select>
                </div>
            </div>

            <label> ساعات التشغيل اليومية</label>
            <div class="flex gap-2">
                <input type="number" step="any" id="en_h" value="8" class="flex-1">
                <select id="days_unit" class="w-1/3">
                    <option value="day">يومياً</option>
                    <option value="week">أسبوعياً</option>
                    <option value="month">شهرياً</option>
                </select>
            </div>

            <label> سعر الكهرباء</label>
            <div class="flex gap-2 mb-2">
                <select id="price_type" class="w-1/2">
                    <option value="fixed">سعر ثابت</option>
                    <option value="tier">شرائح الكهرباء (مصر)</option>
                </select>
                <div id="fixed_price_div" class="flex-1 flex gap-2">
                    <input type="number" step="any" id="en_p" value="1.5" class="w-full">
                    <span class="text-xs self-center">ج.م/kWh</span>
                </div>
            </div>

            <div id="tier_div" style="display:none">
                <label>الاستهلاك الشهري الإجمالي للمنزل (kWh)</label>
                <input type="number" step="any" id="monthly_kwh" value="300" class="w-full">
                <div class="text-xs text-gray-500">يُستخدم لتحديد الشريحة الصحيحة</div>
            </div>

            <label> فترة الحساب</label>
            <select id="period" class="w-full">
                <option value="day">يومي</option>
                <option value="month">شهري</option>
                <option value="year">سنوي</option>
            </select>

            <div class="text-xs text-gray-500 mt-3 bg-gray-50 p-2 rounded">
                 يتم حساب البصمة الكربونية ونصائح توفير الطاقة تلقائياً.
            </div>
        `;
        
        setContent(html, () => {
            let power_w = 0;
            const method = document.getElementById('input_method').value;
            
            if (method === 'appliance') {
                const appliance = document.getElementById('appliance_select').value;
                if (!appliance) {
                    showToast('اختر جهازاً من القائمة', 'warning');
                    return;
                }
                power_w = appliances[appliance];
            } else {
                let powerVal = parseFloat(document.getElementById('en_w').value);
                const unit = document.getElementById('power_unit').value;
                if (isNaN(powerVal) || powerVal <= 0) {
                    showToast('أدخل قدرة صحيحة (>0)', 'warning');
                    return;
                }
                if (unit === 'kw') power_w = powerVal * 1000;
                else if (unit === 'hp') power_w = powerVal * 746;
                else power_w = powerVal;
            }
            
            let hours_raw = parseFloat(document.getElementById('en_h').value);
            const daysUnit = document.getElementById('days_unit').value;
            if (isNaN(hours_raw) || hours_raw <= 0) {
                showToast('أدخل ساعات تشغيل صحيحة', 'warning');
                return;
            }
            let hours_per_day = hours_raw;
            if (daysUnit === 'week') hours_per_day = hours_raw / 7;
            else if (daysUnit === 'month') hours_per_day = hours_raw / 30;
            
            const priceType = document.getElementById('price_type').value;
            let price_per_kwh;
            let priceNote = '';
            if (priceType === 'fixed') {
                price_per_kwh = parseFloat(document.getElementById('en_p').value);
                if (isNaN(price_per_kwh) || price_per_kwh <= 0) {
                    showToast('أدخل سعراً صحيحاً', 'warning');
                    return;
                }
            } else {
                const monthlyTotal = parseFloat(document.getElementById('monthly_kwh').value);
                if (isNaN(monthlyTotal) || monthlyTotal < 0) {
                    showToast('أدخل الاستهلاك الشهري الإجمالي', 'warning');
                    return;
                }
                const tier = tiers.find(t => monthlyTotal >= t.min && monthlyTotal <= t.max);
                if (tier) {
                    price_per_kwh = tier.price;
                    priceNote = ` (${tier.name})`;
                } else {
                    price_per_kwh = tiers[tiers.length-1].price;
                    priceNote = ` (شريحة متقدمة)`;
                }
            }
            
            const period = document.getElementById('period').value;
            const power_kw = power_w / 1000;
            const daily_kwh = power_kw * hours_per_day;
            
            let multiplier = 1, periodName = '';
            if (period === 'day') { multiplier = 1; periodName = 'اليومي'; }
            else if (period === 'month') { multiplier = 30; periodName = 'الشهري'; }
            else { multiplier = 365; periodName = 'السنوي'; }
            
            const total_kwh = daily_kwh * multiplier;
            const total_cost = total_kwh * price_per_kwh;
            const cost_per_hour = power_kw * price_per_kwh;
            const co2_kg = total_kwh * 0.5;
            const co2_tons = co2_kg / 1000;
            const trees_needed = Math.ceil(co2_tons * 45);
            
            let tips = [];
            if (power_w > 1000) {
                tips.push(` الجهاز قدرته ${(power_w/1000).toFixed(1)} كيلوواط، تشغيله ساعة يستهلك ${power_kw.toFixed(1)} كيلوواط ساعة.`);
            }
            if (hours_per_day > 12) {
                tips.push(` التشغيل ${hours_per_day.toFixed(1)} ساعة يومياً طويل جداً، حاول تقليله.`);
            }
            if (power_w > 500 && hours_per_day > 5) {
                const potential_saving = total_cost * 0.4;
                tips.push(`?? جهاز بديل موفر قد يوفر ≈ ${Math.round(potential_saving)} ج.م ${periodName === 'اليومي' ? 'يومياً' : (periodName === 'الشهري' ? 'شهرياً' : 'سنوياً')}.`);
            }
            
            let comparison = '';
            if (power_w > 200) {
                const ledCount = Math.floor(power_w / 12);
                comparison = ` استهلاك هذا الجهاز يعادل ${ledCount} لمبة LED (12 واط) تعمل لنفس المدة.`;
            }
            
            const results = {
                'القدرة الكهربائية': `${power_w.toFixed(0)} واط (${power_kw.toFixed(2)} كيلوواط)`,
                ' ساعات التشغيل اليومية': `${hours_per_day.toFixed(1)} ساعة/يوم`,
                ' الاستهلاك اليومي': `${round2(daily_kwh)} كيلوواط ساعة`,
                [` الاستهلاك ${periodName}`]: `${round2(total_kwh)} كيلوواط ساعة`,
                ' سعر الكيلوواط': `${round2(price_per_kwh)} ج.م/kWh${priceNote}`,
                [` التكلفة ${periodName.toLowerCase()}`]: `${round2(total_cost)} ج.م`,
                'التكلفة السنوية (تقديرية)': `${round2(total_cost * (period === 'year' ? 1 : 365/multiplier))} ج.م`,
                ' تكلفة الساعة': `${round2(cost_per_hour)} ج.م`,
                ' البصمة الكربونية': `${round2(co2_kg)} كجم CO₂ (${round2(co2_tons)} طن)`
            };
            
            if (trees_needed > 0) results[' تعويض الكربون'] = `تحتاج زراعة ≈ ${trees_needed} شجرة سنوياً`;
            if (comparison) results[' مقارنة'] = comparison;
            
            showFullRes(` تكلفة الكهرباء - ${periodName}`, results);
            if (tips.length) {
                const tipsHtml = `<div class="saving-tip" style="background:#dcfce7; border-right:4px solid #22c55e; padding:10px; margin-top:10px; border-radius:8px;"><strong> نصائح توفير الطاقة:</strong><br>${tips.map(t => '• ' + t).join('<br>')}</div>`;
                const resDiv = document.getElementById('resultDisplay');
                if (resDiv) resDiv.insertAdjacentHTML('beforeend', tipsHtml);
            }
        });
        
        setTimeout(() => {
            const methodSelect = document.getElementById('input_method');
            const applianceDiv = document.getElementById('appliance_section');
            const manualDiv = document.getElementById('manual_section');
            const priceType = document.getElementById('price_type');
            const fixedDiv = document.getElementById('fixed_price_div');
            const tierDiv = document.getElementById('tier_div');
            
            if (methodSelect) {
                const toggleMethod = () => {
                    if (methodSelect.value === 'appliance') {
                        applianceDiv.style.display = 'block';
                        manualDiv.style.display = 'none';
                    } else {
                        applianceDiv.style.display = 'none';
                        manualDiv.style.display = 'block';
                    }
                    clearResult();
                };
                methodSelect.addEventListener('change', toggleMethod);
                toggleMethod();
            }
            
            if (priceType) {
                const togglePrice = () => {
                    if (priceType.value === 'fixed') {
                        fixedDiv.style.display = 'flex';
                        tierDiv.style.display = 'none';
                    } else {
                        fixedDiv.style.display = 'none';
                        tierDiv.style.display = 'block';
                    }
                    clearResult();
                };
                priceType.addEventListener('change', togglePrice);
                togglePrice();
            }
        }, 10);
        return;
    }
    
    else if (toolId === 'wire') {
        title.innerText = ' تصميم مقطع السلك ';
        
        const AMPACITY_TABLE = TOOL_CONSTANTS.ampacityTable;
        const INSTALLATION_FACTOR = TOOL_CONSTANTS.installationFactor;
        const RESISTIVITY_20 = TOOL_CONSTANTS.resistivity20;
        
        setContent(`
            <label> التيار (أمبير)</label>
            <input type="number" step="any" id="w_a" value="20" class="w-full">
            
            <label> طول السلك (متر)</label>
            <input type="number" step="any" id="w_l" value="30" class="w-full">
            <div class="text-xs text-gray-500">ملاحظة: الطول من الموزع إلى الحمل (ذهاب فقط)</div>
            
            <label>الجهد (فولت)</label>
            <input type="number" step="any" id="w_voltage" value="230" class="w-full">
            
            <label> درجة الحرارة المحيطة (°C)</label>
            <input type="number" step="any" id="w_temp" value="30" class="w-full">
            
            <div class="phase-selector">
                <div class="phase-option selected" data-wire-phase="single" onclick="ToolHelpers.setWirePhase(this, 'single')"> فاز واحد</div>
                <div class="phase-option" data-wire-phase="three" onclick="ToolHelpers.setWirePhase(this, 'three')">ثلاثة فاز</div>
            </div>
            
            <div class="phase-selector">
                <div class="phase-option selected" data-wire-material="cu" onclick="ToolHelpers.setWireMaterial(this, 'cu')"> نحاس</div>
                <div class="phase-option" data-wire-material="al" onclick="ToolHelpers.setWireMaterial(this, 'al')"> ألمنيوم</div>
            </div>
            
            <label> طريقة التمديد</label>
            <select id="install_method" class="w-full">
                <option value="air">في الهواء الحر</option>
                <option value="conduit">داخل ماسورة</option>
                <option value="buried">مدفون مباشرة</option>
            </select>
            
            <label>نسبة هبوط الجهد المسموحة (%)</label>
            <select id="vdrop_percent" class="w-full">
                <option value="2">2% (حساس - إضاءة LED)</option>
                <option value="3" selected>3% (قياسي - NEC)</option>
                <option value="5">5% (متسامح - محركات)</option>
            </select>
            
            <div class="text-xs text-gray-500 mt-2"> التحذيرات والتوصيات تظهر في النتيجة</div>
        `, () => {
            let I_raw = parseFloat(document.getElementById('w_a').value);
            let L = parseFloat(document.getElementById('w_l').value);
            let voltage = parseFloat(document.getElementById('w_voltage').value);
            let temp = parseFloat(document.getElementById('w_temp').value);
            let vDropPerc = parseFloat(document.getElementById('vdrop_percent').value);
            let installMethod = document.getElementById('install_method').value;
            
            if (isNaN(I_raw) || I_raw <= 0) { showToast('أدخل تيار صحيح (>0)', 'warning'); return; }
            if (isNaN(L) || L <= 0) { showToast('أدخل طول صحيح (>0)', 'warning'); return; }
            if (isNaN(voltage) || voltage <= 0) { showToast('أدخل جهد صحيح (>0)', 'warning'); return; }
            if (isNaN(temp) || temp < -10 || temp > 90) { showToast('درجة حرارة غير منطقية (-10 إلى 90°C)', 'warning'); return; }
            
            if (I_raw > 200) showToast(' تيار عالي جداً - راجع تصميم الأحمال', 'warning');
            if (L > 150) showToast('طول كبير - هبوط الجهد قد يكون مشكلة', 'warning');
            if (temp > 50) showToast(' حرارة عالية - قلل التيار أو زد المقطع', 'warning');
            
            const phaseElem = document.querySelector('#modalBody .phase-option.selected[data-wire-phase]');
            const materialElem = document.querySelector('#modalBody .phase-option.selected[data-wire-material]');
            const isThreePhase = phaseElem && phaseElem.dataset.wirePhase === 'three';
            const isAluminum = materialElem && materialElem.dataset.wireMaterial === 'al';
            const material = isAluminum ? 'al' : 'cu';
            
            let resistivity20 = RESISTIVITY_20[material];
            let tempFactor = 1 + 0.004 * (temp - 20);
            let resistivity = resistivity20 * tempFactor;
            let effectiveLength = isThreePhase ? L : L * 2;
            
            let areaVD;
            if (isThreePhase) {
                areaVD = (Math.sqrt(3) * I_raw * effectiveLength * resistivity) / (voltage * (vDropPerc / 100));
            } else {
                areaVD = (2 * I_raw * effectiveLength * resistivity) / (voltage * (vDropPerc / 100));
            }
            
            let ampacityTable = AMPACITY_TABLE[material];
            let installFactor = INSTALLATION_FACTOR[installMethod];
            let requiredAmpacity = I_raw / installFactor;
            
            let ampacityValues = Object.keys(ampacityTable).map(Number).sort((a,b) => a-b);
            let minAmpacitySize = null;
            for (let size of ampacityValues) {
                if (ampacityTable[size] >= requiredAmpacity) {
                    minAmpacitySize = size;
                    break;
                }
            }
            
            if (minAmpacitySize === null) {
                showToast(' التيار كبير جداً - لا يتوفر مقطع مناسب في الجداول', 'error');
                return;
            }
            
            let stdSizes = ampacityValues;
            let finalSizeByVD = getNearestStdArea(areaVD, stdSizes);
            let finalSize = Math.max(finalSizeByVD, minAmpacitySize);
            
            let vdWarning = '';
            if (finalSize > finalSizeByVD) {
                vdWarning = ` تم اختيار مقطع ${finalSize} مم² لتلبية متطلبات Ampacity (تحمل التيار)`;
            }
            
            let actualVD, actualVDpercent;
            if (isThreePhase) {
                actualVD = (Math.sqrt(3) * I_raw * effectiveLength * resistivity) / finalSize;
            } else {
                actualVD = (2 * I_raw * effectiveLength * resistivity) / finalSize;
            }
            actualVDpercent = (actualVD / voltage) * 100;
            
            let recommendation = '';
            let safetyWarning = '';
            
            if (finalSize > minAmpacitySize && finalSize > finalSizeByVD) {
                recommendation = ' اختيار آمن (يُرضي Ampacity وهبوط الجهد)';
            } else if (finalSize === finalSizeByVD && finalSize > minAmpacitySize) {
                recommendation = ' يتحكم فيه Ampacity - التيار هو العامل المحدد';
                safetyWarning = 'التيار قريب من الحد الأقصى للسلك - تجنب زيادة الأحمال';
            } else if (finalSize === minAmpacitySize && finalSize > finalSizeByVD) {
                recommendation = ' يتحكم فيه هبوط الجهد - الطول هو العامل المحدد';
            } else {
                recommendation = ' اختيار متوازن';
            }
            
            if (actualVDpercent > vDropPerc) {
                recommendation = 'هبوط الجهد أعلى من المسموح - زد المقطع درجة';
                safetyWarning = ` الهبوط الفعلي ${actualVDpercent.toFixed(1)}% > ${vDropPerc}% المسموحة`;
            }
            
            if (actualVDpercent > 5) {
                safetyWarning += '  هبوط جهد كبير جداً - أداء الأجهزة سيتأثر بشدة';
            }
            
            let resultObj = {
                'تنبيه مهم': 'هذه حسابات تقريبية. للتصاميم الحرجة استشر NEC أو الكود المحلي.',
                'التيار': `${I_raw} A`,
                'طول الكابل': `${L} m (ذهاب) → ${effectiveLength} m (فعال)`,
                ' النظام': isThreePhase ? `ثلاثة فاز ${voltage}V` : `فاز واحد ${voltage}V`,
                ' المادة': isAluminum ? 'ألمنيوم' : 'نحاس',
                ' درجة الحرارة': `${temp}°C (معامل المقاومية ×${tempFactor.toFixed(2)})`,
                'طريقة التمديد': installMethod === 'air' ? 'في الهواء' : (installMethod === 'conduit' ? 'داخل ماسورة' : 'مدفون'),
                ' هبوط الجهد المسموح': `${vDropPerc}%`,
                ' المقطع المحسوب (هبوط الجهد)': `${areaVD.toFixed(2)} mm² → قياسي ${finalSizeByVD} mm²`,
                ' المقطع المطلوب (Ampacity)': `${minAmpacitySize} mm² (يتحمل ${ampacityTable[minAmpacitySize]} A ≥ ${requiredAmpacity.toFixed(1)} A)`,
                ' المقطع النهائي الموصى به': `${finalSize} mm²`,
                ' هبوط الجهد الفعلي': `${actualVD.toFixed(2)} V (${actualVDpercent.toFixed(1)}%)`,
                'التوصية': recommendation
            };
            
            if (safetyWarning) resultObj['تحذير السلامة'] = safetyWarning;
            if (vdWarning) resultObj['ملاحظة'] = vdWarning;
            
            showFullRes('نتائج تصميم مقطع السلك', resultObj);
        });
        
        window.ToolHelpers.setWirePhase = function(btn, phase) { 
            document.querySelectorAll('#modalBody .phase-option[data-wire-phase]').forEach(b=>b.classList.remove('selected'));
            btn.classList.add('selected');
            clearResult();
        };
        window.ToolHelpers.setWireMaterial = function(btn, mat) { 
            document.querySelectorAll('#modalBody .phase-option[data-wire-material]').forEach(b=>b.classList.remove('selected'));
            btn.classList.add('selected');
            clearResult();
        };
        
        window.getNearestStdArea = function(area, stdSizes = null) {
            if (!stdSizes) stdSizes = Object.keys(AMPACITY_TABLE.cu).map(Number).sort((a,b) => a-b);
            if (area <= stdSizes[0]) return stdSizes[0];
            for (let i = 0; i < stdSizes.length; i++) {
                if (stdSizes[i] >= area) return stdSizes[i];
            }
            return stdSizes[stdSizes.length - 1];
        };
        return;
    }
    
    else if (toolId === 'elec_laws') {
        title.innerText = ' قوانين الكهرباء';
        setContent(`
            <div class="phase-selector">
                <div class="phase-option selected" onclick="ToolHelpers.setPhase(this,1)">فاز واحد (220V)</div>
                <div class="phase-option" onclick="ToolHelpers.setPhase(this,3)">ثلاثة فاز (380V)</div>
            </div>
            <label>القدرة (P - واط)</label><input type="number" step="any" id="el_p">
            <label>الجهد (V - فولت)</label><input type="number" step="any" id="el_v" value="220">
            <label>التيار (I - أمبير)</label><input type="number" step="any" id="el_i">
            <label>المقاومة (R - أوم)</label><input type="number" step="any" id="el_r">
        `, () => { smartElectricCalc(); });
        window.ToolHelpers.setPhase = function(btn, phase) { 
            document.querySelectorAll('#modalBody .phase-option').forEach(b=>b.classList.remove('selected')); 
            btn.classList.add('selected');
            clearResult();
        };
        return;
    }
    
    else if (toolId === 'cap_calc') {
        title.innerText = ' حساب المكثف ';
        
        function round2(v) { return Math.round(v * 100) / 100; }
        function round1(v) { return Math.round(v * 10) / 10; }
        function round0(v) { return Math.round(v); }
        
        setContent(`
            <div class="flex gap-2 mb-3">
                <label class="flex-1">طريقة الحساب</label>
                <select id="calc_mode" class="flex-1">
                    <option value="cap">حساب السعة </option>
                    <option value="current">حساب التيار</option>
                </select>
            </div>
            
            <div id="mode_cap_section">
                <label> التيار (أمبير)</label>
                <input type="number" step="any" id="c_a" value="5" class="w-full">
            </div>
            
            <div id="mode_current_section" style="display: none;">
                <label> سعة المكثف (µF)</label>
                <input type="number" step="any" id="c_uf" value="50" class="w-full">
            </div>
            
            <label> الجهد (فولت)</label>
            <input type="number" step="any" id="c_v" value="220" class="w-full">
            
            <label> التردد (Hz)</label>
            <select id="c_freq" class="w-full mb-2">
                <option value="50">50 Hz (مصر، السعودية، أوروبا)</option>
                <option value="60">60 Hz (أمريكا، كندا، اليابان)</option>
            </select>
            
            <label> النظام</label>
            <select id="c_phase" class="w-full mb-2">
                <option value="single">فاز واحد (Single Phase)</option>
                <option value="three">ثلاثة فاز (Three Phase)</option>
            </select>
            
            <label>معامل القدرة المستهدف (لتحسين PF)</label>
            <input type="number" step="0.01" id="c_pf" value="0.95" placeholder="0.8 إلى 0.99" class="w-full">
            <div class="text-xs text-gray-500 mt-1">الافتراضي 0.95 للمحركات - استخدم 1.0 للمكثفات البدء</div>
        `, () => {
            const calcMode = document.getElementById('calc_mode').value;
            const voltage = parseFloat(document.getElementById('c_v').value);
            const freq = parseFloat(document.getElementById('c_freq').value);
            const phase = document.getElementById('c_phase').value;
            const targetPf = parseFloat(document.getElementById('c_pf').value);
            
            if (isNaN(voltage) || voltage <= 0) { showToast('أدخل جهد صحيح (>0)', 'warning'); return; }
            if (isNaN(freq) || (freq !== 50 && freq !== 60)) { showToast('اختر تردد 50 أو 60 Hz', 'warning'); return; }
            if (isNaN(targetPf) || targetPf <= 0 || targetPf > 1) { showToast('معامل قدرة بين 0 و 1', 'warning'); return; }
            
            const omega = 2 * Math.PI * freq;
            let result = {};
            
            if (voltage > 1000) showToast(' جهد عالي - تأكد من سلامة المكثف', 'warning');
            
            if (calcMode === 'cap') {
                const current = parseFloat(document.getElementById('c_a').value);
                if (isNaN(current) || current <= 0) { showToast('أدخل تيار صحيح (>0)', 'warning'); return; }
                
                let capacitance_uf;
                let formula_used = '';
                
                if (phase === 'single') {
                    let Xc = voltage / current;
                    let capacitance_farad = 1 / (omega * Xc);
                    capacitance_uf = capacitance_farad * 1e6;
                    formula_used = 'C (µF) = (I × 10⁶) / (2πf × V)';
                } else {
                    let Xc = voltage / (Math.sqrt(3) * current);
                    let capacitance_farad = 1 / (omega * Xc);
                    capacitance_uf = capacitance_farad * 1e6;
                    formula_used = 'C (µF) = (I × 10⁶) / (2πf × V × √3)';
                }
                
                let reactivePower;
                if (phase === 'single') {
                    reactivePower = voltage * current;
                } else {
                    reactivePower = Math.sqrt(3) * voltage * current;
                }
                
                result = {
                    ' طريقة الحساب': 'حساب السعة من التيار',
                    ' التيار المقاس': `${round2(current)} A`,
                    ' الجهد': `${round0(voltage)} V`,
                    ' التردد': `${freq} Hz`,
                    'النظام': phase === 'single' ? 'فاز واحد' : 'ثلاثة فاز',
                    ' المفاعلة السعوية (Xc)': `${round2(voltage / (phase === 'single' ? current : current * Math.sqrt(3)))} Ω`,
                    ' سعة المكثف المطلوبة': `${round1(capacitance_uf)} µF`,
                    ' القدرة التفاعلية (Qc)': `${round0(reactivePower / 1000)} kVAR`,
                    ' معامل القدرة المستهدف': targetPf,
                    ' المعادلة المستخدمة': formula_used
                };
                
                if (capacitance_uf > 500) {
                    result[' توصية'] = 'سعة كبيرة (>500µF) - يفضل استخدام عدة مكثفات على التوازي';
                } else if (capacitance_uf < 1) {
                    result[' توصية'] = ' سعة صغيرة جداً - تحقق من قراءة التيار';
                } else {
                    result[' توصية'] = ' سعة مناسبة - تأكد من جهد المكثف أن يكون أعلى من جهد التشغيل';
                }
                
            } else {
                const capacitance_uf = parseFloat(document.getElementById('c_uf').value);
                if (isNaN(capacitance_uf) || capacitance_uf <= 0) { showToast('أدخل سعة صحيحة (>0 µF)', 'warning'); return; }
                
                let current;
                let formula_used = '';
                let capacitance_farad = capacitance_uf / 1e6;
                let Xc = 1 / (omega * capacitance_farad);
                
                if (phase === 'single') {
                    current = voltage / Xc;
                    formula_used = 'I (A) = V / Xc  ,  Xc = 1/(2πfC)';
                } else {
                    current = voltage / (Math.sqrt(3) * Xc);
                    formula_used = 'I (A) = V / (√3 × Xc)  ,  Xc = 1/(2πfC)';
                }
                
                let reactivePower;
                if (phase === 'single') {
                    reactivePower = voltage * current;
                } else {
                    reactivePower = Math.sqrt(3) * voltage * current;
                }
                
                result = {
                    'طريقة الحساب': 'حساب التيار من السعة',
                    'سعة المكثف': `${round1(capacitance_uf)} µF`,
                    ' الجهد': `${round0(voltage)} V`,
                    'التردد': `${freq} Hz`,
                    'النظام': phase === 'single' ? 'فاز واحد' : 'ثلاثة فاز',
                    ' المفاعلة السعوية (Xc)': `${round2(Xc)} Ω`,
                    ' التيار المتوقع': `${round2(current)} A`,
                    'القدرة التفاعلية (Qc)': `${round0(reactivePower / 1000)} kVAR`,
                    ' معامل القدرة المستهدف': targetPf,
                    ' المعادلة المستخدمة': formula_used
                };
                
                if (current > 50) {
                    result[' توصية'] = ' تيار عالي (>50A) - تأكد من توصيلات المكثف';
                } else if (current < 0.5) {
                    result[' توصية'] = 'تيار ضعيف - السعة صغيرة أو الجهد منخفض';
                } else {
                    result[' توصية'] = ' تيار مناسب';
                }
            }
            
            if (freq === 60 && calcMode === 'cap') {
                let currentVal = parseFloat(document.getElementById('c_a')?.value);
                if (currentVal && currentVal > 0) {
                    let equivalent_50Hz = currentVal * (60/50);
                    result[' ملاحظة'] = `لو كان التردد 50Hz، التيار سيكون ≈ ${round1(equivalent_50Hz)} A لنفس السعة`;
                }
            }
            
            showFullRes('نتائج حساب المكثف', result);
        });
        
        const modeSelect = document.querySelector('#modalBody #calc_mode');
        if (modeSelect) {
            const toggleSections = () => {
                const isCapMode = document.getElementById('calc_mode').value === 'cap';
                const capSection = document.getElementById('mode_cap_section');
                const currentSection = document.getElementById('mode_current_section');
                if (capSection) capSection.style.display = isCapMode ? 'block' : 'none';
                if (currentSection) currentSection.style.display = isCapMode ? 'none' : 'block';
            };
            modeSelect.addEventListener('change', toggleSections);
            setTimeout(toggleSections, 10);
        }
        return;
    }
    
    else if (toolId === 'capacitors') {
        title.innerText = 'توصيل المكثفات';
        
        let conn = 'parallel';
        let num = 2;
        let seriesLen = 2;
        let branches = 2;
        
        let seriesCache = {}, parallelCache = {};

        const seriesCalc = (arr) => {
            let key = arr.join(',');
            if (seriesCache[key]) return seriesCache[key];
            let res = 1 / arr.reduce((a, b) => a + 1 / b, 0);
            seriesCache[key] = res;
            return res;
        };
        
        const parallelCalc = (arr) => {
            let key = arr.join(',');
            if (parallelCache[key]) return parallelCache[key];
            let res = arr.reduce((a, b) => a + b, 0);
            parallelCache[key] = res;
            return res;
        };
        
        const clearResultsCap = () => {
            const resultDisplay = document.getElementById('resultDisplay');
            if (resultDisplay) resultDisplay.classList.add('hidden');
        };
        
        const calcMixed = () => {
            const order = document.getElementById('mixOrder').value;
            const rows = branches;
            const cols = seriesLen;
            let branchEqs = [];
            for (let r = 1; r <= rows; r++) {
                let vals = [];
                for (let c = 1; c <= cols; c++) {
                    let inp = document.getElementById(`mix_${r}_${c}`);
                    if (inp) {
                        let v = parseFloat(inp.value);
                        if (!isNaN(v) && v > 0) vals.push(v);
                    }
                }
                if (vals.length === 0) continue;
                let eq = (order === 'seriesFirst') ? seriesCalc(vals) : parallelCalc(vals);
                branchEqs.push(eq);
            }
            if (branchEqs.length === 0) {
                showToast('أدخل قيم صحيحة', 'warning');
                return;
            }
            let total = (order === 'seriesFirst') ? parallelCalc(branchEqs) : seriesCalc(branchEqs);
            showFullRes('السعة المكافئة (مختلط)', {
                'ترتيب الحساب': order === 'seriesFirst' ? 'توالي ثم توازي' : 'توازي ثم توالي',
                'عدد الفروع': branches,
                'المكثفات في كل فرع': seriesLen,
                'السعة الكلية': total.toFixed(5) + ' µF'
            });
        };
        
        const calcSimple = () => {
            let currentNum = num;
            if (isNaN(currentNum) || currentNum < 1) currentNum = 1;
            
            let vals = [];
            for (let i = 1; i <= currentNum; i++) {
                let v = parseFloat(document.getElementById(`cap_${i}`).value);
                if (isNaN(v)) {
                    showToast(`المكثف ${i} غير صحيح`, 'warning');
                    return;
                }
                vals.push(v);
            }
            let res = (conn === 'parallel') ? parallelCalc(vals) : seriesCalc(vals);
            showFullRes('نتيجة التوصيل', {
                'نوع التوصيل': conn === 'parallel' ? 'توازي' : 'توالي',
                'القيم': vals.join(' , '),
                'السعة المكافئة': res.toFixed(5) + ' µF'
            });
        };
        
        const genSimpleInputs = (count, containerId, prefix) => {
            let html = '';
            for (let i = 1; i <= count; i++) html += `<input type="number" step="any" id="${prefix}${i}" placeholder="C${i} µF" class="mb-2">`;
            document.getElementById(containerId).innerHTML = `<div class="grid grid-cols-2 gap-2">${html}</div>`;
        };
        
        const updateMixedTable = () => {
            const container = document.getElementById('mixedInputs');
            if (!container) return;
            
            let rows = branches;
            let cols = seriesLen;
            
            if (rows < 1) rows = 1;
            if (cols < 1) cols = 1;
            
            let html = `<div class="overflow-x-auto"><table class="w-full border text-center text-sm"><thead><tr class="bg-blue-50"><th class="border p-1">الفرع</th>`;
            for (let i = 1; i <= cols; i++) {
                html += `<th class="border p-1">C${i}</th>`;
            }
            html += `</tr></thead><tbody>`;
            
            for (let r = 1; r <= rows; r++) {
                html += `<tr><td class="border p-1 font-bold">فرع ${r}</td>`;
                for (let c = 1; c <= cols; c++) {
                    html += `<td class="border p-1"><input type="number" step="any" id="mix_${r}_${c}" class="w-20 text-center"></td>`;
                }
                html += `</tr>`;
            }
            html += `</tbody></table></div>`;
            container.innerHTML = html;
        };
        
        const renderCap = () => {
            clearResultsCap();
            let html = `<div class="flex gap-3 mb-2">
                            <button id="connPar" class="tab-btn ${conn === 'parallel' ? 'active' : ''}">توازي</button>
                            <button id="connSer" class="tab-btn ${conn === 'series' ? 'active' : ''}">توالي</button>
                            <button id="connMix" class="tab-btn ${conn === 'mixed' ? 'active' : ''}">مختلط</button>
                        </div>`;
            
            if (conn === 'mixed') {
                html += `<label>عدد المكثفات في كل فرع</label>
                         <input type="number" id="seriesLen" min="1" max="6" value="${seriesLen}" class="mb-2">
                         <label>عدد الفروع</label>
                         <input type="number" id="branches" min="1" max="6" value="${branches}" class="mb-2">
                         <label>ترتيب الحساب</label>
                         <select id="mixOrder" class="mb-3">
                             <option value="seriesFirst">توالي ثم توازي</option>
                             <option value="parallelFirst">توازي ثم توالي</option>
                         </select>
                         <div id="mixedInputs"></div>`;
            } else {
                html += `<label>عدد المكثفات</label>
                         <input type="number" id="numCaps" min="1" max="10" value="${num}" class="mb-2">
                         <div id="capsInputs"></div>`;
            }
            
            body.innerHTML = html;
            bindClearResultOnChange(body);
            
            if (conn === 'mixed') {
                const seriesLenInput = document.getElementById('seriesLen');
                const branchesInput = document.getElementById('branches');
                const orderSelect = document.getElementById('mixOrder');
                
                const refreshTable = () => {
                    updateMixedTable();
                    clearResultsCap();
                };
                
                if (seriesLenInput) {
                    seriesLenInput.oninput = () => {
                        let val = seriesLenInput.value.trim();
                        if (val === '') return;
                        let newVal = parseInt(val);
                        if (!isNaN(newVal) && newVal >= 1 && newVal <= 6) {
                            seriesLen = newVal;
                            refreshTable();
                        }
                    };
                    seriesLenInput.onblur = () => {
                        let val = seriesLenInput.value.trim();
                        if (val === '') {
                            seriesLen = 1;
                            seriesLenInput.value = 1;
                            refreshTable();
                        } else {
                            let newVal = parseInt(val);
                            if (isNaN(newVal) || newVal < 1) {
                                seriesLen = 1;
                                seriesLenInput.value = 1;
                                refreshTable();
                            } else if (newVal > 6) {
                                seriesLen = 6;
                                seriesLenInput.value = 6;
                                refreshTable();
                            }
                        }
                    };
                }
                
                if (branchesInput) {
                    branchesInput.oninput = () => {
                        let val = branchesInput.value.trim();
                        if (val === '') return;
                        let newVal = parseInt(val);
                        if (!isNaN(newVal) && newVal >= 1 && newVal <= 6) {
                            branches = newVal;
                            refreshTable();
                        }
                    };
                    branchesInput.onblur = () => {
                        let val = branchesInput.value.trim();
                        if (val === '') {
                            branches = 1;
                            branchesInput.value = 1;
                            refreshTable();
                        } else {
                            let newVal = parseInt(val);
                            if (isNaN(newVal) || newVal < 1) {
                                branches = 1;
                                branchesInput.value = 1;
                                refreshTable();
                            } else if (newVal > 6) {
                                branches = 6;
                                branchesInput.value = 6;
                                refreshTable();
                            }
                        }
                    };
                }
                
                updateMixedTable();
                calcBtn.onclick = () => calcMixed();
                calcBtn.style.display = 'flex';
            } else {
                const numCapsInput = document.getElementById('numCaps');
                if (numCapsInput) {
                    numCapsInput.oninput = () => {
                        let val = numCapsInput.value.trim();
                        if (val === '') return;
                        let newNum = parseInt(val);
                        if (!isNaN(newNum) && newNum >= 1 && newNum <= 10) {
                            num = newNum;
                            genSimpleInputs(num, 'capsInputs', 'cap_');
                            clearResultsCap();
                        }
                    };
                    numCapsInput.onblur = () => {
                        let val = numCapsInput.value.trim();
                        if (val === '') {
                            num = 1;
                            numCapsInput.value = 1;
                            genSimpleInputs(1, 'capsInputs', 'cap_');
                            clearResultsCap();
                        } else {
                            let newNum = parseInt(val);
                            if (isNaN(newNum) || newNum < 1) {
                                num = 1;
                                numCapsInput.value = 1;
                                genSimpleInputs(1, 'capsInputs', 'cap_');
                                clearResultsCap();
                            } else if (newNum > 10) {
                                num = 10;
                                numCapsInput.value = 10;
                                genSimpleInputs(10, 'capsInputs', 'cap_');
                                clearResultsCap();
                            }
                        }
                    };
                }
                genSimpleInputs(num, 'capsInputs', 'cap_');
                calcBtn.onclick = () => calcSimple();
                calcBtn.style.display = 'flex';
            }
            
            const parBtn = document.getElementById('connPar');
            const serBtn = document.getElementById('connSer');
            const mixBtn = document.getElementById('connMix');
            if (parBtn) parBtn.onclick = () => { conn = 'parallel'; renderCap(); };
            if (serBtn) serBtn.onclick = () => { conn = 'series'; renderCap(); };
            if (mixBtn) mixBtn.onclick = () => { conn = 'mixed'; renderCap(); };
        };
        
        renderCap();
        calcBtn.style.display = 'flex';
        return;
    }
    
    else if (toolId === 'resistors') {
        title.innerText = 'توصيل المقاومات';
        
        let conn = 'parallel';
        let num = 2;
        let seriesLen = 2;
        let branches = 2;
        
        let seriesCache = {}, parallelCache = {};

        const seriesCalc = (arr) => {
            let key = arr.join(',');
            if (seriesCache[key]) return seriesCache[key];
            let res = arr.reduce((a, b) => a + b, 0);
            seriesCache[key] = res;
            return res;
        };
        
        const parallelCalc = (arr) => {
            let key = arr.join(',');
            if (parallelCache[key]) return parallelCache[key];
            let res = 1 / arr.reduce((a, b) => a + 1 / b, 0);
            parallelCache[key] = res;
            return res;
        };
        
        const clearResultsRes = () => {
            const resultDisplay = document.getElementById('resultDisplay');
            if (resultDisplay) resultDisplay.classList.add('hidden');
        };
        
        const calcMixed = () => {
            const order = document.getElementById('mixOrder').value;
            const rows = branches;
            const cols = seriesLen;
            let branchEqs = [];
            for (let r = 1; r <= rows; r++) {
                let vals = [];
                for (let c = 1; c <= cols; c++) {
                    let inp = document.getElementById(`mix_${r}_${c}`);
                    if (inp) {
                        let v = parseFloat(inp.value);
                        if (!isNaN(v) && v > 0) vals.push(v);
                    }
                }
                if (vals.length === 0) continue;
                let eq = (order === 'seriesFirst') ? seriesCalc(vals) : parallelCalc(vals);
                branchEqs.push(eq);
            }
            if (branchEqs.length === 0) {
                showToast('أدخل قيم صحيحة', 'warning');
                return;
            }
            let total = (order === 'seriesFirst') ? parallelCalc(branchEqs) : seriesCalc(branchEqs);
            showFullRes('المقاومة المكافئة (مختلط)', {
                'ترتيب الحساب': order === 'seriesFirst' ? 'توالي ثم توازي' : 'توازي ثم توالي',
                'عدد الفروع': branches,
                'المقاومات في كل فرع': seriesLen,
                'المقاومة الكلية': total.toFixed(5) + ' Ω'
            });
        };
        
        const calcSimple = () => {
            let currentNum = num;
            if (isNaN(currentNum) || currentNum < 1) currentNum = 1;
            
            let vals = [];
            for (let i = 1; i <= currentNum; i++) {
                let v = parseFloat(document.getElementById(`res_${i}`).value);
                if (isNaN(v)) {
                    showToast(`المقاوم ${i} غير صحيح`, 'warning');
                    return;
                }
                vals.push(v);
            }
            let res = (conn === 'parallel') ? parallelCalc(vals) : seriesCalc(vals);
            showFullRes('نتيجة التوصيل', {
                'نوع التوصيل': conn === 'parallel' ? 'توازي' : 'توالي',
                'القيم': vals.join(' , '),
                'المقاومة المكافئة': res.toFixed(5) + ' Ω'
            });
        };
        
        const genSimpleInputs = (count, containerId, prefix) => {
            let html = '';
            for (let i = 1; i <= count; i++) html += `<input type="number" step="any" id="${prefix}${i}" placeholder="R${i} Ω" class="mb-2">`;
            document.getElementById(containerId).innerHTML = `<div class="grid grid-cols-2 gap-2">${html}</div>`;
        };
        
        const updateMixedTable = () => {
            const container = document.getElementById('mixedInputs');
            if (!container) return;
            
            let rows = branches;
            let cols = seriesLen;
            
            if (rows < 1) rows = 1;
            if (cols < 1) cols = 1;
            
            let html = `<div class="overflow-x-auto"><table class="w-full border text-center text-sm"><thead><tr class="bg-blue-50"><th class="border p-1">الفرع</th>`;
            for (let i = 1; i <= cols; i++) {
                html += `<th class="border p-1">R${i}</th>`;
            }
            html += `<table></thead><tbody>`;
            
            for (let r = 1; r <= rows; r++) {
                html += `<tr><td class="border p-1 font-bold">فرع ${r}</td>`;
                for (let c = 1; c <= cols; c++) {
                    html += `<td class="border p-1"><input type="number" step="any" id="mix_${r}_${c}" class="w-20 text-center" placeholder="Ω"></td>`;
                }
                html += `</tr>`;
            }
            html += `</tbody></table></div>`;
            container.innerHTML = html;
        };
        
        const renderRes = () => {
            clearResultsRes();
            let html = `<div class="flex gap-3 mb-2">
                            <button id="connPar" class="tab-btn ${conn === 'parallel' ? 'active' : ''}">توازي</button>
                            <button id="connSer" class="tab-btn ${conn === 'series' ? 'active' : ''}">توالي</button>
                            <button id="connMix" class="tab-btn ${conn === 'mixed' ? 'active' : ''}">مختلط</button>
                        </div>`;
            
            if (conn === 'mixed') {
                html += `<label>عدد المقاومات في كل فرع</label>
                         <input type="number" id="seriesLen" min="1" max="6" value="${seriesLen}" class="mb-2">
                         <label>عدد الفروع</label>
                         <input type="number" id="branches" min="1" max="6" value="${branches}" class="mb-2">
                         <label>ترتيب الحساب</label>
                         <select id="mixOrder" class="mb-3">
                             <option value="seriesFirst">توالي ثم توازي</option>
                             <option value="parallelFirst">توازي ثم توالي</option>
                         </select>
                         <div id="mixedInputs"></div>`;
            } else {
                html += `<label>عدد المقاومات</label>
                         <input type="number" id="numRes" min="1" max="10" value="${num}" class="mb-2">
                         <div id="resInputs"></div>`;
            }
            
            body.innerHTML = html;
            bindClearResultOnChange(body);
            
            if (conn === 'mixed') {
                const seriesLenInput = document.getElementById('seriesLen');
                const branchesInput = document.getElementById('branches');
                const orderSelect = document.getElementById('mixOrder');
                
                const refreshTable = () => {
                    updateMixedTable();
                    clearResultsRes();
                };
                
                if (seriesLenInput) {
                    seriesLenInput.oninput = () => {
                        let val = seriesLenInput.value.trim();
                        if (val === '') return;
                        let newVal = parseInt(val);
                        if (!isNaN(newVal) && newVal >= 1 && newVal <= 6) {
                            seriesLen = newVal;
                            refreshTable();
                        }
                    };
                    seriesLenInput.onblur = () => {
                        let val = seriesLenInput.value.trim();
                        if (val === '') {
                            seriesLen = 1;
                            seriesLenInput.value = 1;
                            refreshTable();
                        } else {
                            let newVal = parseInt(val);
                            if (isNaN(newVal) || newVal < 1) {
                                seriesLen = 1;
                                seriesLenInput.value = 1;
                                refreshTable();
                            } else if (newVal > 6) {
                                seriesLen = 6;
                                seriesLenInput.value = 6;
                                refreshTable();
                            }
                        }
                    };
                }
                
                if (branchesInput) {
                    branchesInput.oninput = () => {
                        let val = branchesInput.value.trim();
                        if (val === '') return;
                        let newVal = parseInt(val);
                        if (!isNaN(newVal) && newVal >= 1 && newVal <= 6) {
                            branches = newVal;
                            refreshTable();
                        }
                    };
                    branchesInput.onblur = () => {
                        let val = branchesInput.value.trim();
                        if (val === '') {
                            branches = 1;
                            branchesInput.value = 1;
                            refreshTable();
                        } else {
                            let newVal = parseInt(val);
                            if (isNaN(newVal) || newVal < 1) {
                                branches = 1;
                                branchesInput.value = 1;
                                refreshTable();
                            } else if (newVal > 6) {
                                branches = 6;
                                branchesInput.value = 6;
                                refreshTable();
                            }
                        }
                    };
                }
                
                updateMixedTable();
                calcBtn.onclick = () => calcMixed();
                calcBtn.style.display = 'flex';
            } else {
                const numResInput = document.getElementById('numRes');
                if (numResInput) {
                    numResInput.oninput = () => {
                        let val = numResInput.value.trim();
                        if (val === '') return;
                        let newNum = parseInt(val);
                        if (!isNaN(newNum) && newNum >= 1 && newNum <= 10) {
                            num = newNum;
                            genSimpleInputs(num, 'resInputs', 'res_');
                            clearResultsRes();
                        }
                    };
                    numResInput.onblur = () => {
                        let val = numResInput.value.trim();
                        if (val === '') {
                            num = 1;
                            numResInput.value = 1;
                            genSimpleInputs(1, 'resInputs', 'res_');
                            clearResultsRes();
                        } else {
                            let newNum = parseInt(val);
                            if (isNaN(newNum) || newNum < 1) {
                                num = 1;
                                numResInput.value = 1;
                                genSimpleInputs(1, 'resInputs', 'res_');
                                clearResultsRes();
                            } else if (newNum > 10) {
                                num = 10;
                                numResInput.value = 10;
                                genSimpleInputs(10, 'resInputs', 'res_');
                                clearResultsRes();
                            }
                        }
                    };
                }
                genSimpleInputs(num, 'resInputs', 'res_');
                calcBtn.onclick = () => calcSimple();
                calcBtn.style.display = 'flex';
            }
            
            const parBtn = document.getElementById('connPar');
            const serBtn = document.getElementById('connSer');
            const mixBtn = document.getElementById('connMix');
            if (parBtn) parBtn.onclick = () => { conn = 'parallel'; renderRes(); };
            if (serBtn) serBtn.onclick = () => { conn = 'series'; renderRes(); };
            if (mixBtn) mixBtn.onclick = () => { conn = 'mixed'; renderRes(); };
        };
        
        renderRes();
        calcBtn.style.display = 'flex';
        return;
    }
    
    else if (toolId === 'voltage_drop') {
        title.innerText = ' هبوط الجهد (دقيق)';
        setContent(`
            <label>التيار (أمبير)</label><input type="number" step="any" id="vd_i" value="20">
            <label>طول الكابل (متر)</label><input type="number" step="any" id="vd_l" value="50">
            <label>جهد المصدر (فولت)</label><input type="number" step="any" id="vd_v" value="220">
            <label>مقطع السلك (مم²)</label><input type="number" step="any" id="vd_a" value="4">
            <label>معامل القدرة (cosφ)</label><input type="number" step="0.01" id="vd_pf" value="0.85">
            <div class="phase-selector">
                <div class="phase-option selected" data-phase="single" onclick="setPhase(this,'single')">فاز واحد</div>
                <div class="phase-option" data-phase="three" onclick="setPhase(this,'three')">ثلاثة فاز</div>
            </div>
            <div class="phase-selector">
                <div class="phase-option selected" data-mat="cu" onclick="setMaterial(this,'cu')">نحاس</div>
                <div class="phase-option" data-mat="al" onclick="setMaterial(this,'al')">ألمنيوم</div>
            </div>
            <label>الحد الأقصى (%)</label>
            <select id="vd_limit"><option value="3">3% (إضاءة)</option><option value="5" selected>5% (قوى)</option></select>
        `, () => {
            let I=+vd_i.value, L=+vd_l.value, V=+vd_v.value, A=+vd_a.value, pf=+vd_pf.value, limit=+vd_limit.value;
            if(I<=0||L<=0||V<=0||A<=0||pf<=0||pf>1) return showToast('قيم غير صالحة','warning');
            let is3ph = document.querySelector('#modalBody [data-phase].selected')?.dataset.phase === 'three';
            let isAl = document.querySelector('#modalBody [data-mat].selected')?.dataset.mat === 'al';
            let rho20 = isAl ? 0.0282 : 0.0175;
            let tempCoef = isAl ? 0.00403 : 0.00393;
            let rho = rho20 * (1 + tempCoef * 50);
            let Rm = rho / A;
            let Xm = 0.0001;
            let Zm = Math.hypot(Rm, Xm);
            let vDrop = (is3ph ? Math.sqrt(3) : 2) * L * I * Zm * pf;
            let pct = vDrop/V*100;
            let status = pct<=limit ? ' مقبول' : `يفضل مقطع ${Math.ceil( (is3ph?Math.sqrt(3):2)*L*I*rho*pf / (V*limit/100) )} mm²`;
            showFullRes('هبوط الجهد', { التيار:I+'A', الطول:L+'m', الجهد:V+'V', المقطع:A+'mm²', PF:pf, النظام:is3ph?'3 فاز':'1 فاز', المادة:isAl?'ألمنيوم':'نحاس', الهبوط:vDrop.toFixed(2)+'V', النسبة:pct.toFixed(2)+'%', الحالة:status });
        });
        window.setPhase = (btn,ph)=>{ document.querySelectorAll('#modalBody [data-phase]').forEach(b=>b.classList.remove('selected')); btn.classList.add('selected'); clearResult(); };
        window.setMaterial = (btn,mat)=>{ document.querySelectorAll('#modalBody [data-mat]').forEach(b=>b.classList.remove('selected')); btn.classList.add('selected'); clearResult(); };
        return;
    }
    
    else if (toolId === 'motor_amp') {
        title.innerText = ' حساب تيار المحرك';
        setContent(`
            <div class="grid gap-3">
                <div>
                    <label class="block mb-1 text-sm font-semibold">القدرة</label>
                    <div class="flex gap-2">
                        <input type="number" step="any" id="power_val" value="1.5">
                        <select id="power_unit">
                            <option value="hp">حصان (HP)</option>
                            <option value="kw">كيلووات (kW)</option>
                            <option value="w">وات (w)</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-semibold">الجهد (V)</label>
                    <input type="number" step="any" id="ma_v" value="220" class="w-full p-1.5 border rounded-lg">
                </div>
                <div>
                    <label class="block text-sm font-semibold">الكفاءة (η)</label>
                    <input type="number" step="any" id="ma_eff" value="0.9" class="w-full p-1.5 border rounded-lg">
                </div>
                <div>
                    <label class="block text-sm font-semibold">معامل القدرة (PF)</label>
                    <input type="number" step="any" id="ma_pf" value="0.85" class="w-full p-1.5 border rounded-lg">
                </div>
                <div class="phase-selector flex gap-2">
                    <div class="phase-option selected flex-1 text-center" data-phase="single" onclick="setPhase(this,'single')"> فاز واحد</div>
                    <div class="phase-option flex-1 text-center" data-phase="three" onclick="setPhase(this,'three')">ثلاثة فاز</div>
                </div>
            </div>
        `, () => {
            window.setPhase = function(btn, phase) {
                document.querySelectorAll('#modalBody .phase-option[data-phase]').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                if (typeof clearResult === 'function') clearResult();
            };

            const calculate = () => {
                let val = parseFloat(document.getElementById('power_val').value);
                let unit = document.getElementById('power_unit').value;
                let v = parseFloat(document.getElementById('ma_v').value);
                let eff = parseFloat(document.getElementById('ma_eff').value);
                let pf = parseFloat(document.getElementById('ma_pf').value);
                let isThree = document.querySelector('#modalBody .phase-option.selected[data-phase]')?.dataset.phase === 'three';

                if (isNaN(val) || val <= 0) return showToast('أدخل قدرة موجبة', 'warning');
                if (isNaN(v) || v <= 0) return showToast('أدخل جهداً موجباً', 'warning');
                if (isNaN(eff) || eff <= 0 || eff > 1) return showToast('الكفاءة بين 0 و 1', 'warning');
                if (isNaN(pf) || pf <= 0 || pf > 1) return showToast('معامل القدرة بين 0 و 1', 'warning');

                let watts;
                let unitText;
                if (unit === 'hp') { watts = val * 746; unitText = `${val} HP`; }
                else if (unit === 'kw') { watts = val * 1000; unitText = `${val} kW`; }
                else { watts = val; unitText = `${val} W`; }

                let current = isThree ? watts / (Math.sqrt(3) * v * eff * pf) : watts / (v * eff * pf);

                showFullRes('تيار المحرك', {
                    'القدرة المدخلة': unitText,
                    'القدرة الفعلية (واط)': `${watts.toFixed(2)} W`,
                    'الجهد': `${v} V`,
                    'النظام': isThree ? 'ثلاثة فاز' : 'فاز واحد',
                    'الكفاءة (η)': eff,
                    'معامل القدرة (PF)': pf,
                    'التيار المحسوب (A)': current.toFixed(2)
                });
            };

            ['power_val', 'power_unit', 'ma_v', 'ma_eff', 'ma_pf'].forEach(id => {
                let el = document.getElementById(id);
                if (el) el.addEventListener('input', () => { if (typeof clearResult === 'function') clearResult(); });
            });

            let btn = document.getElementById('calculateBtn');
            if (btn) btn.onclick = () => (typeof withLoading === 'function' ? withLoading(btn, calculate) : calculate());
        });
        return;
    }
    
    else if (toolId === 'universal_conv') {
        title.innerText = ' محول شامل';
        const convDB = {
            "التبريد (Cooling)": {
                "وحدة حرارية بريطانية (btu)": 1,
                "حصان تبريد (hp)": 8000,
                "طن تبريد (ton)": 12000,
                "كيلوواط تبريد (kw_t)": 10723.86058981,
                "سعر حراري في الساعة (kcal_h)": 3.96832,
                "واط تبريد (w_t)": 10.72386058981,
                "مليون وحدة حرارية في الساعة (MBH)": 1000,
                "ميجاواط تبريد (MW_t)": 10723860.58981
            },
            "الطول (Length)": {
                "متر (m)": 1,
                "سنتيمتر (cm)": 0.01,
                "مليمتر (mm)": 0.001,
                "كيلومتر (km)": 1000,
                "بوصة (in)": 0.0254,
                "قدم (ft)": 0.3048,
                "ياردة (yd)": 0.9144,
                "ميل (mi)": 1609.344,
                "ميل بحري (nmi)": 1852,
                "ميل (mil)": 0.0000254,
                "ميكرومتر (µm)": 0.000001,
                "نانومتر (nm)": 1e-9,
                "ديسيمتر (dm)": 0.1,
                "شبر (hand)": 0.1016,
                "فرسخ (league)": 4828.032,
                "أنغستروم (Å)": 1e-10
            },
            "المساحة (Area)": {
                "متر² (m2)": 1,
                "سنتيمتر² (cm²)": 0.0001,
                "مليمتر² (mm²)": 0.000001,
                "كيلومتر² (km²)": 1000000,
                "بوصة² (in²)": 0.00064516,
                "قدم² (ft²)": 0.09290304,
                "ياردة² (yd²)": 0.83612736,
                "آكر (ac)": 4046.856,
                "هكتار (ha)": 10000,
                "فدان (f)": 4200,
                "قيراط (k)": 175,
                "سهم (s)": 7.29166667,
                "دونم (dunam)": 1000,
                "ميل² (mi2)": 2589988.11,
                "سنتيار (ca)": 1,
            },
            "الحجم (Volume)": {
                "متر³ (m³)": 1,
                "لتر (l)": 0.001,
                "ميليلتر (ml)": 0.000001,
                "سنتيمتر³ (cm³)": 0.000001,
                "غالون أمريكي (gal_us)": 0.00378541,
                "غالون بريطاني (gal_uk)": 0.00454609,
                "قدم³ (ft³)": 0.0283168,
                "بوصة³ (in³)": 0.000016387,
                "برميل (bbl)": 0.158987,
                "كوارت أمريكي (qt_us)": 0.000946353,
                "باينت أمريكي (pt_us)": 0.000473176,
                "كوب أمريكي (cup_us)": 0.000236588,
                "ملعقة كبيرة (tbsp)": 0.0000147868,
                "ملعقة صغيرة (tsp)": 0.00000492892
            },
            "الكتلة (Mass)": {
                "كيلوجرام (kg)": 1,
                "جرام (g)": 0.001,
                "ميليجرام (mg)": 0.000001,
                "باوند (lb)": 0.45359237,
                "أونصة (oz)": 0.02834952,
                "طن متري (ton_metric)": 1000,
                "طن أمريكي (ton_us)": 907.1847,
                "طن بريطاني (ton_uk)": 1016.047,
                "قيراط (ct)": 0.0002,
                "حبة (gr)": 0.0000647989,
                "سلاج (slug)": 14.5939
            },
            "الزمن (Time)": {
                "ثانية (s)": 1,
                "دقيقة (min)": 60,
                "ساعة (h)": 3600,
                "يوم (day)": 86400,
                "أسبوع (week)": 604800,
                "سنة (year)": 31536000,
                "ميلي ثانية (ms)": 0.001,
                "ميكروثانية (µs)": 0.000001,
                "نانوثانية (ns)": 1e-9,
                "شهر (month)": 2628000,
                "عقد (decade)": 315360000
            },
            "السرعة (Velocity)": {
                "متر / ثانية (m/s)": 1,
                "كيلومتر / ساعة (km/h)": 0.277778,
                "قدم / ثانية (ft/s)": 0.3048,
                "ميل / ساعة (mph)": 0.44704,
                "عقدة (knot)": 0.514444,
                "سنتيمتر / ثانية (cm/s)": 0.01,
                "ماخ (mach)": 340.3
            },
            "التسارع (Acceleration)": {
                "متر / ثانية مربع (m/s2)": 1,
                "قدم / ثانية مربع (ft/s2)": 0.3048,
                "جاذبية أرضية (g_force)": 9.80665,
                "جال (gal)": 0.01
            },
            "القوة (Force)": {
                "نيوتن (n)": 1,
                "كيلونيوتن (kn)": 1000,
                "باوند قوة (lbf)": 4.44822,
                "كيلوجرام قوة (kgf)": 9.80665,
                "داين (dyn)": 0.00001,
                "ستين (sn)": 1000,
                "ميجانيوتن (MN)": 1000000
            },
            "درجة الحرارة (Temperature)": {
                "سيليسيوس (t°c)": 1,
                "فهرنهايت (r°c)": 1,
                "كلفن (T°K)": 1,
                "رانكين (T°R)": 1
            },
            "الضغط (Pressure)": {
                "باسكال (pa)": 1,
                "كيلوباسكال (kpa)": 1000,
                "ميجاباسكال (mpa)": 1000000,
                "بار (bar)": 100000,
                "مليبار (mbar)": 100,
                "رطل لكل بوصة مربعة (psi)": 6894.76,
                "ضغط جوي (atm)": 101325,
                "تور (torr)": 133.322,
                "مليمتر زئبق (mmhg)": 133.322,
                "بوصة زئبق (inhg)": 3386.39,
                "بوصة ماء (inw.c)": 248.84,
                "قدم ماء (ftH2O)": 2989.07,
                "كيلوجرام قوة لكل سنتيمتر مربع (kgf/cm2)": 98066.5
            },
            "الطاقة (Energy)": {
                "جول (j)": 1,
                "كيلوجول (kj)": 1000,
                "ميجاجول (mj)": 1000000,
                "سعرة حرارية (cal)": 4.184,
                "كيلوسعرة (kcal)": 4184,
                "وحدة حرارية بريطانية (btu)": 1055.056,
                "كيلوواط ساعي (kwh)": 3600000,
                "إلكترون فولت (ev)": 1.60218e-19,
                "قدم-باوند (ft-lb)": 1.355818,
                "ثيرم (therm)": 105505600,
                "طن نفط مكافئ (toe)": 41868000000,
                "حصان-ساعة (hp·h)": 2684519.5
            },
            "القدرة (Power)": {
                "واط (w)": 1,
                "كيلوواط (kw)": 1000,
                "ميجاواط (mw)": 1000000,
                "حصان متري (hp_metric)": 735.499,
                "حصان إمبراطوري (hp_imperial)": 745.7,
                "وحدة حرارية بريطانية لكل ساعة (btu/h)": 0.293071,
                "طن تبريد (ton_refrig)": 3516.85,
                "سعرة حرارية لكل ساعة (kcal/h)": 1.16222,
                "قدم-باوند لكل ثانية (ft·lb/s)": 1.35582
            },
            "الزخم (Momentum)": {
                "كيلوجرام.متر لكل ثانية (kg.m/s)": 1,
                "باوند.قدم لكل ثانية (lb.ft/s)": 0.138255,
                "نيوتن.ثانية (N·s)": 1
            },
            "الكثافة (Density)": {
                "كيلوجرام لكل متر مكعب (kg/m3)": 1,
                "جرام لكل سنتيمتر مكعب (g/cm3)": 1000,
                "باوند لكل قدم مكعب (lb/ft3)": 16.01846,
                "باوند لكل بوصة مكعبة (lb/in3)": 27679.9,
                "سلاج لكل قدم مكعب (slug/ft3)": 515.379,
                "طن لكل متر مكعب (t/m3)": 1000
            },
            "التردد (Frequency)": {
                "هرتز (hz)": 1,
                "كيلوهرتز (khz)": 1000,
                "ميجاهرتز (mhz)": 1000000,
                "جيجاهرتز (ghz)": 1000000000,
                "دورة لكل دقيقة (rpm)": 0.0166667,
                "دورة لكل ثانية (cps)": 1,
                "مليهرتز (mhz)": 0.001
            },
            "الشحنة الكهربائية (Charge)": {
                "كولوم (c)": 1,
                "أمبير-ساعة (ah)": 3600,
                "ملي أمبير-ساعة (mah)": 3.6,
                "فاراداي (F)": 96485,
                "ستات كولوم (statC)": 3.33564e-10
            },
            "التيار الكهربائي (Current)": {
                "أمبير (a)": 1,
                "ملي أمبير (ma)": 0.001,
                "كيلو أمبير (ka)": 1000,
                "ميكرو أمبير (µa)": 0.000001,
                "نانوأمبير (na)": 1e-9
            },
            "الجهد الكهربائي (Voltage)": {
                "فولت (v)": 1,
                "ملي فولت (mv)": 0.001,
                "كيلوفولت (kv)": 1000,
                "ميكروفولت (µv)": 0.000001,
                "ميجافولت (mv)": 1000000
            },
            "المقاومة (Resistance)": {
                "أوم (ohm)": 1,
                "كيلوأوم (kohm)": 1000,
                "ميجاأوم (mohm)": 1000000,
                "ملي أوم (mΩ)": 0.001,
                "ميكروأوم (µΩ)": 0.000001
            },
            "السعة الكهربائية (Capacitance)": {
                "فاراد (f)": 1,
                "ميكروفاراد (uf)": 0.000001,
                "نانوفاراد (nf)": 1e-9,
                "بيكوفاراد (pf)": 1e-12,
                "ملي فاراد (mf)": 0.001,
                "كيلوفاراد (kf)": 1000
            },
        };
        
        setContent(`
            <label>الفئة</label>
            <select id="cv_c">${Object.keys(convDB).map(c=>`<option>${c}</option>`).join('')}</select>
            <label>القيمة</label>
            <input type="number" id="cv_v" value="1">
            <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 12px;">
                <div><label>من</label><select id="cv_f"></select></div>
                <div style="text-align: center;"><button class="swap-btn" id="swapConvBtn"><i class="fas fa-sync-alt"></i></button></div>
                <div><label>إلى</label><select id="cv_t"></select></div>
            </div>
        `, () => {
            const cat = document.getElementById('cv_c').value;
            const val = parseFloat(document.getElementById('cv_v').value);
            const from = document.getElementById('cv_f').value;
            const to = document.getElementById('cv_t').value;
            if(isNaN(val)) { showToast('أدخل قيمة رقمية', 'warning'); return; }
            let res;
            if (cat === 'درجة الحرارة (Temperature)') {
                let c;
                if (from === 'c') c = val;
                else if (from === 'f') c = (val - 32) * 5 / 9;
                else if (from === 'k') c = val - 273.15;
                else if (from === 'r') c = (val - 491.67) * 5 / 9;
                if (to === 'c') res = c;
                else if (to === 'f') res = c * 9 / 5 + 32;
                else if (to === 'k') res = c + 273.15;
                else if (to === 'r') res = c * 9 / 5 + 491.67;
            } else {
                res = (val * convDB[cat][from]) / convDB[cat][to];
            }
            showFullRes('تحويل الوحدات', {'الفئة':cat,'القيمة':val+' '+from,'النتيجة   ':res.toFixed(4)+' '+to});
        });
        
        const updateConvUIDebounced = debounce(() => {
            let cat = document.getElementById('cv_c').value;
            let units = Object.keys(convDB[cat]);
            document.getElementById('cv_f').innerHTML = units.map(u=>`<option>${u}</option>`).join('');
            document.getElementById('cv_t').innerHTML = units.map(u=>`<option>${u}</option>`).join('');
            clearResult();
        }, 100);
        document.getElementById('cv_c').onchange = updateConvUIDebounced;
        updateConvUIDebounced();
        document.getElementById('cv_f').onchange = () => clearResult();
        document.getElementById('cv_t').onchange = () => clearResult();
        document.getElementById('swapConvBtn').onclick = () => { let f=document.getElementById('cv_f'); let t=document.getElementById('cv_t'); let tmp=f.value; f.value=t.value; t.value=tmp; clearResult(); };
        return;
    }
    
    else {
        closeModal();
        showToast('جاري التحديث', 'info');
    }
};