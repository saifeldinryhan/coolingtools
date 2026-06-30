window.openTool = function(toolId) {
    // ------------------- منطق فتح الرابط الإعلاني (مرة كل 3 دقائق لكل أداة) -------------------
    // قراءة وقت آخر فتح للإعلان لهذه الأداة من localStorage
    const adClickTimesRaw = localStorage.getItem('toolAdClickTimes');
    let adClickTimes = adClickTimesRaw ? JSON.parse(adClickTimesRaw) : {};

    const now = Date.now();
    const lastTimeForTool = adClickTimes[toolId] || 0;

    // إذا مر وقت كافٍ، نتحقق من الاتصال (بدون انتظار حتى لا نؤخر عرض الأداة)
    if (now - lastTimeForTool >= AD_COOLDOWN_MS) {
        checkInternet().then(hasInternet => {
            if (hasInternet) {
                window.open(AD_URL, '_blank');
                // تحديث وقت الفتح لهذه الأداة (نفعل ذلك فقط إذا تم فتح الرابط فعلاً)
                adClickTimes[toolId] = now;
                localStorage.setItem('toolAdClickTimes', JSON.stringify(adClickTimes));
            }
        });
    }
    // ------------------- نهاية منطق الإعلان -------------------

    currentToolId = toolId;
    const body = document.getElementById('modalBody');
    const calcBtn = document.getElementById('calculateBtn');
    const modal = document.getElementById('toolModal');
    body.innerHTML = '';
    document.getElementById('resultDisplay').innerHTML = '';
    calcBtn.onclick = null;
    document.getElementById('modalBody').innerHTML = '';
    const title = document.getElementById('modalTitle');
    const resDiv = document.getElementById('resultDisplay');
    const settingsBtn = document.getElementById('settingsToolHeaderBtn');
    resDiv.classList.add('hidden'); 
    settingsBtn.style.display = 'none'; 
    modal.style.display = 'block'; 
    calcBtn.style.display = 'flex';
    
    const setContent = (html, onCalc) => { 
    body.innerHTML = html;
    bindClearResultOnChange(body);
    if (onCalc) {
        calcBtn.onclick = () => withLoading(calcBtn, onCalc);
        // ربط Enter بعد تعيين المحتوى ووجود الزر
        setTimeout(() => bindEnterToCalculate(body, calcBtn), 10);
    } else { 
        calcBtn.onclick = null;
    }
};


//ادوات البيانات
if(toolId === 'ref_table') { 
    showRefTable(); 
    return;
}
else if(toolId === 'pipe_sizing_table') { 
    showPipeSizingTable(); 
    return; 
}
else if(toolId === 'pipe_length_table') { 
    showPipeLengthTable(); 
    return; 
}
else if(toolId === 'wire_current_table') { 
    showWireCurrentTable(); 
    return; 
}
else if(toolId === 'capacitor_table') { 
    showCapacitorTable(); 
    return;
}
    
    // أداة المحول الشامل
    else if(toolId === 'universal_conv') { 
    title.innerText = ' محول شامل';
    setContent(`<label>الفئة</label>
<select id="cv_c">${Object.keys(CONV_DB).map(c=>`<option>${c}</option>`).join('')}</select>
<label>القيمة</label>
<input type="number" id="cv_v" value="1">

<!-- التعديل هنا: تحويل التنسيق إلى رأسي مع زر العكس في المنتصف -->
<div style="display: flex; flex-direction: column; gap: 12px; margin-top: 12px;">
  <div>
    <label>من</label>
    <select id="cv_f"></select>
  </div>
  <div style="text-align: center;">
    <button class="swap-btn" id="swapConvBtn"><i class="fas fa-sync-alt"></i></button>
  </div>
  <div>
    <label>إلى</label>
    <select id="cv_t"></select>
  </div>
</div>`, () => {
        const cat = document.getElementById('cv_c').value;
        const val = parseFloat(document.getElementById('cv_v').value);
        const from = document.getElementById('cv_f').value;
        const to = document.getElementById('cv_t').value;
        if(isNaN(val)) { showToast('أدخل قيمة رقمية', 'warning'); return; }
        let res;
        if (cat === 'درجة الحرارة (Temperature)') {
            // تعريف جميع وحدات الحرارة مع معاملات التحويل إلى سيلسيوس
            const tempUnits = {
                'سيلسيوس (t°C)': { toC: (x) => x, fromC: (x) => x },
                'فهرنهايت (t°F)': { toC: (x) => (x - 32) * 5/9, fromC: (x) => x * 9/5 + 32 },
                'كلفن (T°K)': { toC: (x) => x - 273.15, fromC: (x) => x + 273.15 },
                'رانكين (T°R)': { toC: (x) => (x - 491.67) * 5/9, fromC: (x) => x * 9/5 + 491.67 },
                'نيوتن (t°N)': { toC: (x) => x * 100/33, fromC: (x) => x * 33/100 },
                'ريومور (t°Ré)': { toC: (x) => x * 5/4, fromC: (x) => x * 4/5 },
                'دليسل (Delisle)': { toC: (x) => 100 - (x * 2/3), fromC: (x) => (100 - x) * 3/2 },
                'رومر (t°Rø)': { toC: (x) => (x - 7.5) * 40/21, fromC: (x) => x * 21/40 + 7.5 }
            };
            if (!tempUnits[from] || !tempUnits[to]) {
                showToast('وحدة حرارة غير معروفة', 'error');
                return;
            }
            const celsius = tempUnits[from].toC(val);
            res = tempUnits[to].fromC(celsius);
        } else {
            res = (val * CONV_DB[cat][from]) / CONV_DB[cat][to];
        }
        showFullRes('تحويل الوحدات', {'الفئة':cat,'القيمة':val+' '+from,'النتيجة   ':res.toFixed(4)+' '+to});
    });
    const updateConvUIDebounced = debounce(() => {
        let cat = document.getElementById('cv_c').value;
        let units;
        if (cat === 'درجة الحرارة (Temperature)') {
            units = [
                'سيلسيوس (t°C)',
                'فهرنهايت (t°F)',
                'كلفن (T°K)',
                'رانكين (T°R)',
                'نيوتن (t°N)',
                'ريومور (t°Ré)',
                'دليسل (Delisle)',
                'رومر (t°Rø)'
            ];
        } else {
            units = Object.keys(CONV_DB[cat]);
        }
        document.getElementById('cv_f').innerHTML = units.map(u=>`<option>${u}</option>`).join('');
        document.getElementById('cv_t').innerHTML = units.map(u=>`<option>${u}</option>`).join('');
        clearResult();
    }, 100);
    document.getElementById('cv_c').onchange = updateConvUIDebounced;
    updateConvUIDebounced();
    document.getElementById('cv_f').onchange = () => clearResult();
    document.getElementById('cv_t').onchange = () => clearResult();
    document.getElementById('swapConvBtn').onclick = () => { let f=document.getElementById('cv_f'); let t=document.getElementById('cv_t'); let tmp=f.value; f.value=t.value; t.value=tmp; clearResult(); };
}

else if (toolId === 'saved') {
    title.innerText = ' المحفوظات';
    calcBtn.style.display = 'none';
    settingsBtn.style.display = 'none';
    renderSaved();          
    modal.style.display = 'block';
    return;
}
// ========== أداة تثبيت التطبيق (PWA / APK / iOS) ==========
else if (toolId === 'install') {
    title.innerText = ' تثبيت التطبيق';
    
    // واجهة اختيار طريقة التثبيت
    setContent(`
       <div class="text-center space-y-2 p-2">
    <p class="text-gray-700 mb-2">اختر طريقة التثبيت المناسبة لجهازك</p>

    <button id="installPwaBtn" class="primary-btn w-full flex items-center justify-center gap-3 mb-4">
        <i class="fab fa-chrome"></i> تثبيت PWA (نسخة الويب)
    </button>

    <button id="installApkBtn" class="primary-btn w-full flex items-center justify-center gap-2 bg-green-600 mb-4">
        <i class="fab fa-android"></i> تحميل APK (أندرويد قريبا)
    </button>


    <div class="text-xs text-gray-500 pt-2">
        يمكنك دائماً استخدام التطبيق من المتصفح دون تثبيت
    </div>
</div>
    `, null);
    
    calcBtn.style.display = 'none';
    settingsBtn.style.display = 'none';
    
    // ربط الأزرار بعد إنشاء المحتوى
    setTimeout(() => {
        // زر تثبيت PWA
        const pwaBtn = document.getElementById('installPwaBtn');
        if (pwaBtn) {
            pwaBtn.onclick = async () => {
                if (deferredPrompt) {
                    deferredPrompt.prompt();
                    const { outcome } = await deferredPrompt.userChoice;
                    if (outcome === 'accepted') {
                        showToast(' تم تثبيت التطبيق بنجاح', 'success');
                    } else {
                        showToast('تم إلغاء التثبيت', 'info');
                    }
                    deferredPrompt = null;
                } else {
                    showToast(' المتصفح لا يدعم التثبيت أو تم التثبيت مسبقاً', 'warning');
                }
                closeModal();
            };
        }
        
        // زر تحميل APK (استبدل الرابط برابطك الفعلي)
        const apkBtn = document.getElementById('installApkBtn');
        if (apkBtn) {
            apkBtn.onclick = () => {
                window.open('https://example.com/cooling-tools.apk', '_blank');
                showToast(' جاري تحويلك لتحميل نسخة أندرويد', 'info');
                closeModal();
            };
        }
        
    }, 50);
}
   //ادوات AI
else if (toolId === 'comp_search') {
    title.innerText = ' بحث ضواغط (AI) بالصور';

    // التحقق من وجود مفتاح API
    if (!state.geminiApiKey) {
        setContent(`<div class="instruction-box p-3 text-center">
            <i class="fas fa-key text-2xl text-orange-500 mb-2"></i>
            <p> مطلوب مفتاح Gemini API من الإعدادات الرئيسية</p>
            <button id="goToSettingsBtn" class="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg" انتقل إلى الإعدادات</button>
        </div>`, null);
        calcBtn.style.display = 'none';
        
        setTimeout(() => {
            const settingsBtn = document.getElementById('goToSettingsBtn');
            if (settingsBtn) settingsBtn.onclick = () => { closeModal(); openMainSettings(); };
        }, 50);
        return;
    }

    // واجهة البحث (مع إضافة رفع الصور)
    setContent(`
        <div class="space-y-4">
            <div class="instruction-box bg-blue-50 p-3 rounded-lg text-sm">
                <i class="fas fa-info-circle text-blue-600 ml-2"></i>
                أدخل موديل الضاغط أو ارفع صورة للوحة البيانات (أو كلاهما)
            </div>
            
            <!-- حقل النص + زر رفع الصور -->
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
            
            <!-- معاينة الصور المرفوعة -->
            <div id="compImagePreview" class="flex flex-wrap gap-2"></div>
            
            <!-- مؤشر التحميل -->
            <div id="compLoadingIndicator" class="hidden text-center py-4">
                <i class="fas fa-spinner fa-pulse text-blue-600 text-2xl"></i>
                <p class="text-sm text-gray-500 mt-2">جاري البحث عن مواصفات الضاغط...</p>
            </div>
            
            <!-- منطقة عرض النتائج (الأزرار تظهر بداخلها ديناميكياً) -->
            <div id="compResultArea" class="mt-4 max-h-[500px] overflow-y-auto  rounded-lg p-2 bg-transparent"></div>
            
            <!-- أزرار إضافية (تظهر فقط عند الحاجة، سيتم إضافتها داخل النتيجة) -->
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
        
        let selectedImageFiles = [];   // تخزين الصور المرفوعة
        
        // رفع الصور
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
        
        // دالة البحث (تدعم الصور)
        async function searchCompressor() {
            const model = modelInput.value.trim();
            if (!model && selectedImageFiles.length === 0) {
                showToast('الرجاء إدخال موديل الضاغط أو رفع صورة', 'warning');
                return;
            }
            
            if (loadingIndicator) loadingIndicator.classList.remove('hidden');
            if (resultArea) resultArea.innerHTML = '';
            
            // بناء النص المبدئي
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
                    // استخدام AIManager مع الصور (يجب أن تكون sendMessageStream معدلة لقبول الصور)
                    // نستخدم Promise لتجميع الرد كاملاً (لأن sendMessageStream تعطي chunks)
                    responseText = await new Promise((resolve, reject) => {
                        let full = '';
                        aiManager.sendMessageStream(prompt, selectedImageFiles,
                            (chunk, acc) => { full = acc; },  // onChunk
                            (final) => resolve(final),         // onComplete
                            (err) => reject(new Error(err))     // onError
                        );
                    });
                } else if (aiManager && aiManager.sendMessage) {
                    // إذا كان sendMessage فقط (بدون صور) للتوافق
                    responseText = await aiManager.sendMessage(prompt);
                } else {
                    // Fallback: استخدام Gemini API مباشرة (بدون صور)
                    responseText = await fallbackGeminiCall(prompt);
                }
                
                if (resultArea) {
                    resultArea.innerHTML = formatCompressorResponse(responseText, model || 'من الصورة');
                }
                showToast('تم العثور على معلومات الضاغط', 'success');
                
                // حفظ البحث في سجل المحادثات العام إذا أمكن
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
        
        // Fallback المباشر (بدون صور)
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
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error?.message || `HTTP ${response.status}`);
            }
            const data = await response.json();
            const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!reply) throw new Error('رد فارغ');
            return reply;
        }
        
        // دالة تنسيق الرد (تظهر أزرار النسخ والحفظ فقط داخل الرد)
        function formatCompressorResponse(text, modelName) {
            if (!text) return '<div class="text-red-600"> لا توجد بيانات</div>';
            
            let formatted = formatGeminiResponse(text, `بحث ضاغط: ${modelName}`);
            return formatted;
      }        
            
        
        
        // ربط الأحداث
        if (searchBtn) searchBtn.onclick = () => searchCompressor();
        if (modelInput) {
            modelInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') searchCompressor();
            });
        }
        
        // إضافة أمثلة سريعة
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
        
        // تنظيف عند إغلاق النافذة (اختياري)
        modal.addEventListener('beforehide', () => {
            if (fileInput) fileInput.remove();
        }, { once: true });
        
    }, 50);
}
   else if (toolId === 'ai_assistant') {
    title.innerText = 'المساعد الذكي';
    
    // التحقق من وجود مفتاح API
    if (!state.geminiApiKey) {
        setContent(`
            <div class="instruction-box p-3 text-center">
                <i class="fas fa-key text-2xl text-orange-500 mb-2"></i>
                <p> مطلوب مفتاح Gemini API من الإعدادات الرئيسية</p>
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
    
    // عرض مؤقت "جاري التحميل" لحين تجهيز المساعد
    setContent(`<div id="aiChatContainer" style="height: 550px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #f9fafb; border-radius: 12px;">
        <div class="text-gray-500 text-center">
            <i class="fas fa-spinner fa-pulse text-2xl mb-2"></i>
            <p>جاري تحميل المساعد الذكي...</p>
        </div>
    </div>`, null);
    calcBtn.style.display = 'none';
    
    // دالة آمنة لتهيئة المساعد باستخدام initAIManager العامة
    const initAISafely = () => {
        try {
            // التأكد من وجود الحاوية
            const container = document.getElementById('aiChatContainer');
            if (!container) {
                console.warn('aiChatContainer not found, retrying...');
                setTimeout(initAISafely, 100);
                return;
            }
            
            // استخدام الدالة العامة (الموجودة في basic.js) لتهيئة aiManager
            if (typeof initAIManager === 'function') {
                initAIManager('aiChatContainer');
            } else {
                // Fallback في حالة عدم وجود الدالة (لن يحدث)
                if (!aiManager) aiManager = new AIManager();
                aiManager.apiKey = state.geminiApiKey;
                aiManager.selectedModel = state.selectedGeminiModel;
                aiManager.initUI(container);
            }
            
            // تحديث إضافي للتأكد من أن الإعدادات محدثة
            if (aiManager) {
                aiManager.apiKey = state.geminiApiKey;
                aiManager.selectedModel = state.selectedGeminiModel;
                if (aiManager.render) aiManager.render();
            }
        } catch (err) {
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
    
    // إعطاء مهلة قصيرة لظهور الحاوية في DOM
    setTimeout(initAISafely, 150);
}

//ادوات التبريد 

// ================= أداة البحث عن رموز الأعطال (Error Codes) =================
// ================= أداة البحث عن رموز الأعطال (Error Codes) =================
else if (toolId === 'error_search') {
    title.innerText = ' البحث عن رموز الأعطال';

    // التحقق من وجود بيانات الرموز
    if (typeof errorCodes === 'undefined') {
        setContent(`
            <div class="instruction-box p-3 text-center">
                <i class="fas fa-exclamation-triangle text-2xl text-red-500 mb-2"></i>
                <p>بيانات رموز الأعطال غير متوفرة. تأكد من تحميل ملف <strong>errorCodes.js</strong>.</p>
                <button onclick="location.reload()" class="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg">إعادة تحميل الصفحة</button>
            </div>
        `, null);
        calcBtn.style.display = 'none';
        return;
    }

    // ---------- دوال مساعدة لاستخراج البيانات ----------
    function getAllErrors() {
        const all = [];
        for (const company in errorCodes) {
            for (const device in errorCodes[company]) {
                for (const system in errorCodes[company][device]) {
                    const list = errorCodes[company][device][system];
                    if (Array.isArray(list)) {
                        list.forEach(item => {
                            all.push({
                                company,
                                device,
                                system,
                                code: item.code,
                                meaning: item.meaning,
                                causes: item.causes,
                                treatment: item.treatment
                            });
                        });
                    }
                }
            }
        }
        return all;
    }

    function getCompanies() {
    const comps = new Set();
    for (const c in errorCodes) comps.add(c);
    const all = Array.from(comps);
    // إذا كانت "عام" موجودة، ننقلها إلى البداية
    if (all.includes('عام')) {
        const idx = all.indexOf('عام');
        all.splice(idx, 1);
        all.unshift('عام');
    }
    return all;
}

    function getDevices() {
        return ['تكييف', 'ثلاجة'];
    }

    function getSystems() {
        return ['الكل', 'عادي', 'إنفرتر'];
    }

    // ---------- بناء واجهة المستخدم ----------
    const allErrors = getAllErrors();
    const companies = getCompanies();
    const devices = getDevices();
    const systems = getSystems();

    // الحالة الافتراضية للفلتر
    let filterCompany = companies[0] || '';
    let filterDevice = devices[0] || '';
    let filterSystem = 'الكل';
    let searchText = '';

    // دالة تصفية البيانات
    function filterErrors() {
        return allErrors.filter(err => {
            let match = true;
            if (filterCompany && err.company !== filterCompany) match = false;
            if (filterDevice && err.device !== filterDevice) match = false;
            if (filterSystem !== 'الكل' && err.system !== filterSystem) match = false;
            if (searchText.trim() !== '') {
                const s = searchText.trim().toLowerCase();
                const inCode = err.code.toLowerCase().includes(s);
                const inMeaning = err.meaning.toLowerCase().includes(s);
                if (!inCode && !inMeaning) match = false;
            }
            return match;
        });
    }

    // دالة عرض النتائج في الجدول
    function renderResults() {
        const filtered = filterErrors();
        const container = document.getElementById('errorResultsContainer');
        if (!container) return;

        if (filtered.length === 0) {
            container.innerHTML = `<div class="text-center p-4 text-gray-500">لا توجد رموز تطابق الفلاتر المحددة</div>`;
            return;
        }

        let html = `
            <div class="overflow-x-auto rounded-lg border border-gray-200">
                <table class="w-full text-sm text-right">
                    <thead class="bg-blue-50 text-gray-700 border-b">
                        <tr>
                            <th class="p-2 font-semibold">الرمز</th>
                            <th class="p-2 font-semibold">المعنى</th>
                            <th class="p-2 font-semibold">الشركة</th>
                            <th class="p-2 font-semibold">الجهاز</th>
                            <th class="p-2 font-semibold">النظام</th>
                            <th class="p-2 font-semibold">التفاصيل</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        filtered.forEach(err => {
            html += `
                <tr class="border-b hover:bg-gray-50 cursor-pointer" onclick="showErrorDetails('${err.code}', '${err.company}', '${err.device}', '${err.system}')">
                    <td class="p-2 font-bold text-blue-600">${err.code}</td>
                    <td class="p-2">${err.meaning}</td>
                    <td class="p-2">${err.company}</td>
                    <td class="p-2">${err.device}</td>
                    <td class="p-2">${err.system}</td>
                    <td class="p-2 text-blue-500"><i class="fas fa-chevron-left"></i></td>
                </tr>
            `;
        });

        html += `</tbody></table></div>`;
        container.innerHTML = html;
    }

    // دالة عرض تفاصيل رمز معين (تُستدعى عند النقر على صف)
    window.showErrorDetails = function(code, company, device, system) {
        // البحث عن الرمز في البيانات الكاملة
        const err = allErrors.find(e => e.code === code && e.company === company && e.device === device && e.system === system);
        if (!err) {
            showToast('الرمز غير موجود', 'error');
            return;
        }

        const resultObj = {
            'الجهاز': err.device === 'تكييف' ? ' تكييف' : ' ثلاجة',
            'الشركة': err.company,
            'النظام': err.system === 'عادي' ? 'عادي' : 'إنفرتر',
            'الرمز': err.code,
            'المعنى': err.meaning,
            'الأسباب المحتملة': err.causes,
            'العلاج والإصلاح': err.treatment
        };

        showFullRes(` تفاصيل رمز العطل ${err.code}`, resultObj);
    };

    // دالة بناء الواجهة
    function buildUI() {
        const companyOptions = companies.map(c => `<option value="${c}" ${c === filterCompany ? 'selected' : ''}>${c}</option>`).join('');
        const deviceOptions = devices.map(d => `<option value="${d}" ${d === filterDevice ? 'selected' : ''}>${d}</option>`).join('');
        const systemOptions = systems.map(s => `<option value="${s}" ${s === filterSystem ? 'selected' : ''}>${s}</option>`).join('');

        const html = `
            <div class="space-y-4">
                <!-- شريط الفلاتر -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                        <label class="block text-sm font-semibold mb-1"> الشركة</label>
                        <select id="filterCompany" class="w-full">${companyOptions}</select>
                    </div>
                    <div>
                        <label class="block text-sm font-semibold mb-1"> الجهاز</label>
                        <select id="filterDevice" class="w-full">${deviceOptions}</select>
                    </div>
                    <div>
                        <label class="block text-sm font-semibold mb-1"> النظام</label>
                        <select id="filterSystem" class="w-full">${systemOptions}</select>
                    </div>
                    <div>
                        <label class="block text-sm font-semibold mb-1"> بحث سريع</label>
                        <input type="text" id="searchInput" placeholder="E0" class="w-full p-2 border text-center rounded-lg" value="${searchText}">
                    </div>
                </div>

                <!-- أزرار إضافية -->
                <div class="flex gap-2 flex-wrap">
                    <button id="applyFiltersBtn" class="primary-btn px-4 py-2">تطبيق الفلاتر</button>
                    <button id="resetFiltersBtn" class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg"> إعادة ضبط</button>
                    <span class="text-sm text-gray-500 self-center mr-2" id="resultCount">0 رمز</span>
                </div>

                <!-- منطقة عرض النتائج -->
                <div id="errorResultsContainer" class="mt-2 max-h-[500px] overflow-y-auto"></div>

                <div class="instruction-box bg-blue-50 p-3 rounded-lg text-sm">
                    انقر على أي صف لعرض التفاصيل الكاملة (الأسباب والعلاج)
                </div>
            </div>
        `;

        setContent(html, null);
        calcBtn.style.display = 'none';

        // ربط الأحداث بعد إنشاء DOM
        setTimeout(() => {
            const companySel = document.getElementById('filterCompany');
            const deviceSel = document.getElementById('filterDevice');
            const systemSel = document.getElementById('filterSystem');
            const searchInp = document.getElementById('searchInput');
            const applyBtn = document.getElementById('applyFiltersBtn');
            const resetBtn = document.getElementById('resetFiltersBtn');
            const countSpan = document.getElementById('resultCount');

            // دالة تحديث الفلاتر وعرض النتائج
            function applyFilters() {
                filterCompany = companySel ? companySel.value : filterCompany;
                filterDevice = deviceSel ? deviceSel.value : filterDevice;
                filterSystem = systemSel ? systemSel.value : filterSystem;
                searchText = searchInp ? searchInp.value : searchText;

                renderResults();
                const filtered = filterErrors();
                if (countSpan) countSpan.textContent = `${filtered.length} رمز`;
            }

            // ربط الأحداث
            if (applyBtn) applyBtn.onclick = applyFilters;
            if (resetBtn) {
                resetBtn.onclick = () => {
                    if (companySel) companySel.value = companies[0] || '';
                    if (deviceSel) deviceSel.value = devices[0] || '';
                    if (systemSel) systemSel.value = 'الكل';
                    if (searchInp) searchInp.value = '';
                    filterCompany = companies[0] || '';
                    filterDevice = devices[0] || '';
                    filterSystem = 'الكل';
                    searchText = '';
                    applyFilters();
                };
            }

            // تطبيق الفلاتر عند تغيير القوائم أو البحث (مع debounce)
            const debounceApply = debounce(applyFilters, 300);
            if (companySel) companySel.onchange = debounceApply;
            if (deviceSel) deviceSel.onchange = debounceApply;
            if (systemSel) systemSel.onchange = debounceApply;
            if (searchInp) searchInp.oninput = debounceApply;

            // عرض النتائج الأولية
            applyFilters();

        }, 20);
    }

    buildUI();
}
else if (toolId === 'room') {
        title.innerText = ' حساب أحمال الغرف';
        let activeMode = window._roomActiveMode || 'normal';
        
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
            const ach = parseFloat(document.getElementById('infiltration_ach')?.value) || 0.5;  // قراءة ACH
            
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
            
            // حساب حمل تسريب الهواء (واط)
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
            
            // جمع جميع الأحمال (بما فيها تسريب الهواء)
            let totalWatts = wallLoad + peopleLoad + lightLoad + equipLoad + productLoad + infiltrationLoad;
            totalWatts *= 1.15;   // إضافة احتياطي 15%
            
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
    }
    
    // ================= أداة الكابلري (مع تحذير التقريب) =================
    else if (toolId === 'capillary') {
    title.innerText = ' حساب الكابلري (الأنبوب الشعري) ';

    // ========== النموذج المتقدم (محسّن) ==========
    function advancedCapillary(capacityWatts, refrigerant, evapTemp, condTemp, subcooling, superheat, liquidLineLen, segments = 30) {
        const props = REFRIGERANT_PROPS[refrigerant];
        if (!props) return null;

        // فرق الضغط الكلي مع خسائر خط السائل
        let deltaP_total = getPressureFromTemp(refrigerant, condTemp) - getPressureFromTemp(refrigerant, evapTemp);
        deltaP_total = Math.max(deltaP_total - (0.5 + liquidLineLen * 0.03), 0.8);
        if (deltaP_total < 0.8) return null;

        // إنثالبي الدخول والخروج (تقريبية)
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

            // فحص التدفق المختنق (Choked Flow)
            let P_entry = getPressureFromTemp(refrigerant, condTemp) - (0.3 + liquidLineLen * 0.02);
            let P_exit = getPressureFromTemp(refrigerant, evapTemp);
            let criticalVelocity = Math.sqrt(2 * (P_entry - P_exit) * 1e5 / rhoL_entry);
            if (vel > criticalVelocity) vel = criticalVelocity;

            let Re = (rhoL_entry * vel * d_m) / props.viscL;
            let f = (Re < 2000) ? (64 / Re) : (0.316 / Math.pow(Re, 0.25));

            // تقسيم الأنبوب إلى شرائح
            let deltaP_seg = (P_entry - P_exit) / segments;
            let totalLength = 0;
            let P_current = P_entry;
            let quality = 0;

            for (let i = 0; i < segments; i++) {
                let P_next = Math.max(P_current - deltaP_seg, P_exit);
                // حساب الجودة بناءً على المحتوى الحراري (أكثر دقة)
                let h_current = h_liq + (i/segments) * (h_vap - h_liq);
                let x = (h_current - h_liq) / (h_vap - h_liq);
                x = Math.min(Math.max(x, 0), 0.98);

                let rhoL_avg = getDensityFromTemp(refrigerant, condTemp - subcooling + (i/segments)*10, 'liquid');
                let rhoG_avg = getDensityFromTemp(refrigerant, evapTemp + superheat + (i/segments)*5, 'vapor');
                let rho_mix = 1 / ((1-x)/rhoL_avg + x/rhoG_avg);
                let mu_mix = props.viscL * (1 - x) + props.viscG * x;
                let vel_mix = massFlow / (rho_mix * area);
                let Re_mix = (rho_mix * vel_mix * d_m) / mu_mix;

                // معامل احتكاك متغير
                let f_mix;
                if (Re_mix < 2000) f_mix = 64 / Re_mix;
                else f_mix = 0.316 / Math.pow(Re_mix, 0.25);

                // معامل Lockhart-Martinelli مع C متغير
                let Xtt = Math.pow((1-x)/Math.max(x, 0.001), 0.9) * Math.pow(rhoG_avg/rhoL_avg, 0.5) * Math.pow(props.viscL/props.viscG, 0.1);
                let C = (Re_mix < 2000) ? 5 : 20; // صفحي أو مضطرب
                let phiL2 = 1 + C/Xtt + 1/(Xtt*Xtt);

                // انخفاض الضغط الاحتكاكي
                let dpdz_fric = f_mix * (1/d_m) * 0.5 * rho_mix * vel_mix * vel_mix * phiL2;
                // انخفاض الضغط نتيجة التسارع
                let dpdz_acc = massFlow * massFlow * (1/rhoG_avg - 1/rhoL_avg) / d_m;
                let dpdz = Math.max(dpdz_fric + dpdz_acc, 1);

                let dz = deltaP_seg * 1e5 / dpdz;
                totalLength += dz;

                quality = x;
                P_current = P_next;
                if (P_current <= P_exit) break;
            }
            // إزالة clamping القاسي: نضمن فقط ألا يكون سالبًا أو صغيرًا جدًا
            totalLength = Math.max(totalLength, 0.2);
            candidates.push({ diameter: diam, length: totalLength, massFlow, deltaP: P_entry - P_exit, Re });
        }

        // اختيار القطر الأمثل بناءً على سرعة معقولة بدلاً من maxFlow
        let best = null;
        let bestScore = Infinity;
        for (let cand of candidates) {
            const d_m = cand.diameter * 0.0254;
            const area = Math.PI * d_m * d_m / 4;
            const rhoL = getDensityFromTemp(refrigerant, condTemp - subcooling, 'liquid');
            const velocity = cand.massFlow / (rhoL * area);
            // السرعة المثالية بين 0.5 و 3 م/ث
            let velBonus = 0;
            if (velocity >= 0.5 && velocity <= 3.0) velBonus = -50;
            else velBonus = Math.abs(velocity - 1.5) * 20;
            // الطول المثالي بين 1 و 3 متر
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

    // ========== الوضع السريع (محسّن قليلاً) ==========
    function quickMode(capacityWatts, refrigerant, evapTemp, condTemp, subcooling, superheat, liquidLineLen) {
        const props = REFRIGERANT_PROPS_QUICK[refrigerant];
        if (!props) return null;
        let deltaP_bar = getPressureFromTemp(refrigerant, condTemp) - getPressureFromTemp(refrigerant, evapTemp);
        deltaP_bar = Math.max(deltaP_bar - (0.5 + liquidLineLen*0.02), 0.8);
        let hL = props.h_liquid*1000 - subcooling*2000;
        let hV = props.h_vapor*1000 + superheat*2000;
        let delta_h = Math.max(hV - hL, 50000);
        let massFlow = capacityWatts / delta_h;
        if (massFlow <= 0) massFlow = 0.003;

        // اختيار القطر بناءً على السرعة (ليس maxFlow الثابت)
        let bestDiameter = CAPILLARY_SIZES[4].inch; // 0.040 افتراضي
        let bestVelocity = Infinity;
        for (let s of CAPILLARY_SIZES) {
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

    function convertPower(value, unit) {
        if (unit === 'btu') return { hp: value/8000, watt: value*0.293071, ton: value/12000 };
        if (unit === 'watt') return { hp: value/745.7, watt: value, ton: value/3516.85 };
        if (unit === 'hp') return { hp: value, watt: value*745.7, ton: value*0.747 };
        return { hp:1, watt:1000, ton:1 };
    }

    // ========== دالة الحساب الرئيسية ==========
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

            // حساب السرعة الفعلية للقطر المختار
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

    // ========== بناء الواجهة وربط الزر ==========
    let refrigerantOptions = Object.keys(refPTData).map(r => `<option value="${r}">${r}</option>`).join('');
    
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

    // ربط الزر
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

    // ربط مسح النتائج
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
}
    
    // ================= أداة المبخر والمكثف =================
   
      else if (toolId === 'evap_cond') {
    title.innerText = ' تصميم المبخر والمكثف';

    // ========== التأكد من الدوال الأساسية ==========
    if (typeof showFullRes !== 'function') window.showFullRes = (title, obj) => { alert(title + "\n" + JSON.stringify(obj, null, 2)); };
    if (typeof showToast !== 'function') window.showToast = (msg, type) => alert(msg);
    if (typeof clearResult !== 'function') window.clearResult = () => {};

    // ========== بيانات التطبيقات ==========
    const appData = {
        ac: { name: 'تكييف عادي', t_air_in_evap: 27, t_air_in_cond: 35, default_evap_temp: 7, default_cond_temp: 50, default_air_vel: 2.5 },
        cooler: { name: 'غرفة تبريد', t_air_in_evap: 4, t_air_in_cond: 30, default_evap_temp: -5, default_cond_temp: 45, default_air_vel: 2.0 },
        freezer: { name: 'غرفة تجميد', t_air_in_evap: -18, t_air_in_cond: 25, default_evap_temp: -25, default_cond_temp: 40, default_air_vel: 1.5 }
    };

    // ========== خصائص الفريونات (مع إضافة لزوجة البخار) ==========
    const refrigerantProps = {
        'R22':   { h_evap: 200000, density_liq: 1190, density_vapor: 35,  viscosity_liq: 0.00023, viscosity_vapor: 0.000013 },
        'R410A': { h_evap: 260000, density_liq: 1090, density_vapor: 40,  viscosity_liq: 0.00022, viscosity_vapor: 0.000014 },
        'R134a': { h_evap: 217000, density_liq: 1207, density_vapor: 32,  viscosity_liq: 0.00028, viscosity_vapor: 0.000012 },
        'R404A': { h_evap: 200000, density_liq: 1040, density_vapor: 38,  viscosity_liq: 0.00024, viscosity_vapor: 0.000013 },
        'R407C': { h_evap: 250000, density_liq: 1130, density_vapor: 36,  viscosity_liq: 0.00025, viscosity_vapor: 0.000013 },
        'R32':   { h_evap: 320000, density_liq: 960,  density_vapor: 45,  viscosity_liq: 0.00020, viscosity_vapor: 0.000015 },
        'R290':  { h_evap: 425000, density_liq: 500,  density_vapor: 22,  viscosity_liq: 0.00012, viscosity_vapor: 0.000008 },
        'R600a': { h_evap: 360000, density_liq: 550,  density_vapor: 18,  viscosity_liq: 0.00018, viscosity_vapor: 0.000007 }
    };

    const diameterOptions = [0.25, 0.3125, 0.375, 0.5, 0.625, 0.75, 0.875, 1.0];
    const diamLabels = {0.25:'1/4"', 0.3125:'5/16"', 0.375:'3/8"', 0.5:'1/2"', 0.625:'5/8"', 0.75:'3/4"', 0.875:'7/8"', 1.0:'1"'};

    const finTypes = {
        'بدون زعانف': { area_mult: 1.0, eta: 1.0, blockage_factor: 0.95 },
        'زعانف عادية (20 فِن/بوصة)': { area_mult: 18, eta: 0.85, blockage_factor: 0.70 },
        'زعانف كثيفة (30 فِن/بوصة)': { area_mult: 24, eta: 0.80, blockage_factor: 0.65 }
    };

    const coilTypes = {
        inline: { name: 'مصفوفة (Inline)', factor: 1.0 },
        staggered: { name: 'متداخلة (Staggered)', factor: 1.15 }
    };

    // ========== دالة تقدير COP ديناميكي ==========
    function estimateCOP(evapTemp, condTemp, appKey) {
        const Te = evapTemp + 273.15;
        const Tc = condTemp + 273.15;
        const carnot = Te / (Tc - Te);
        let factor = 0.5;
        if (appKey === 'freezer') factor = 0.4;
        if (appKey === 'cooler') factor = 0.45;
        return Math.max(1.0, carnot * factor);
    }

    // ========== دالة حساب فقد الضغط (معتمدة على Reynolds) ==========
    function pressureDropPsi(length_m, velocity_mps, diameter_in, density_kg_m3, viscosity_pa_s) {
        const D = diameter_in * 0.0254;
        if (D <= 0 || velocity_mps <= 0 || length_m <= 0) return 0;
        const Re = (density_kg_m3 * velocity_mps * D) / viscosity_pa_s;
        let f;
        if (Re < 2300) {
            f = 64 / Math.max(Re, 1);
        } else {
            f = 0.316 / Math.pow(Re, 0.25);
        }
        f = Math.min(f, 0.1);
        const dp = f * (length_m / D) * (density_kg_m3 * velocity_mps * velocity_mps / 2);
        return dp / 6894.76;
    }

    // ========== دوال LMTD ==========
    function LMTD_evap(t_air_in, t_air_out, t_ref_evap) {
        let dT1 = t_air_in - t_ref_evap;
        let dT2 = t_air_out - t_ref_evap;
        if (dT1 <= 0.1) dT1 = 0.1;
        if (dT2 <= 0.1) dT2 = 0.1;
        if (Math.abs(dT1 - dT2) < 0.1) return dT1;
        return (dT1 - dT2) / Math.log(dT1 / dT2);
    }

    function LMTD_cond(t_ref_cond, t_air_in, t_air_out) {
        let dT1 = t_ref_cond - t_air_in;
        let dT2 = t_ref_cond - t_air_out;
        if (dT1 <= 0.1) dT1 = 0.1;
        if (dT2 <= 0.1) dT2 = 0.1;
        if (Math.abs(dT1 - dT2) < 0.1) return dT1;
        return (dT1 - dT2) / Math.log(dT1 / dT2);
    }

    // ========== معامل انتقال حرارة الهواء مع السرعة الفعلية ==========
    function h_air_from_velocity(vel_m_s, type, blockage_factor) {
        let base = (type === 'cond') ? 15 : 10;
        let effectiveVel = vel_m_s / (blockage_factor || 0.9);
        effectiveVel = Math.min(effectiveVel, 8);
        return base + 12 * Math.pow(effectiveVel, 0.8);
    }

    function h_ref_coeff(type, refrigerant) {
        return type === 'evap' ? 1200 : 2000;
    }

    // ========== حساب معامل انتقال الحرارة الكلي U ==========
    function calculate_U(h_air, h_ref, fin_eta, area_mult, d_tube_m, coilFactor = 1.0) {
        const t_wall = 0.0008;
        const k_cu = 380;
        const r_i = d_tube_m / 2;
        const r_o = r_i + t_wall;
        const R_tube = Math.log(r_o / r_i) / (2 * Math.PI * k_cu);
        const effective_area_ratio = 1 + fin_eta * (area_mult - 1);
        const R_air = 1 / (h_air * effective_area_ratio);
        const R_ref = 1 / h_ref;
        let U = 1 / (R_air + R_tube + R_ref);
        U = U * coilFactor;
        if (area_mult > 20) U *= 1.1;
        U = Math.min(U, 250);
        U = Math.max(U, 5);
        return U;
    }

    function convertPowerToWatt(value, unit) {
        if (unit === 'hp') return value * 745.7;
        if (unit === 'btu') return value * 0.293071;
        return value;
    }

    // ========== تدفق الهواء مع مراعاة الرطوبة ==========
    function airflow_cfm_from_load(watt_load, t_air_in, t_air_out, humidity_fraction = 0.5) {
        let deltaT = Math.abs(t_air_out - t_air_in);
        if (deltaT < 1) deltaT = 1;
        const cp_air = 1005 + (humidity_fraction * 1860);
        let m_dot_air = watt_load / (cp_air * deltaT);
        let vol_flow = m_dot_air / 1.2;
        return Math.max(vol_flow * 2118.88, 50);
    }

    // ========== الوضع المتقدم (بدون تحذيرات طولية) ==========
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

        const aspectRatio = 1.5;
        let face_area_evap_m2 = (cfm_evap / 2118.88) / airVelocity;
        let face_area_cond_m2 = (cfm_cond / 2118.88) / airVelocity;
        
        let width_evap = Math.sqrt(face_area_evap_m2 * aspectRatio);
        let height_evap = face_area_evap_m2 / width_evap;
        let width_cond = Math.sqrt(face_area_cond_m2 * aspectRatio);
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

        // التحذيرات (بدون أي تحذير بخصوص الطول الكبير)
        let warnings = [];
        if (LMTD_evap_val < 5) warnings.push(' LMTD المبخر منخفض جداً (<5)');
        if (LMTD_cond_val < 5) warnings.push(' LMTD المكثف منخفض جداً');
        let dT1_evap = app.t_air_in_evap - evapTemp;
        let dT2_evap = t_air_out_evap - evapTemp;
        if (dT1_evap < 2 || dT2_evap < 2) warnings.push(' فرق درجات حرارة المبخر ضعيف جداً');
        let dT1_cond = condTemp - app.t_air_in_cond;
        let dT2_cond = condTemp - t_air_out_cond;
        if (dT1_cond < 2 || dT2_cond < 2) warnings.push('فرق درجات حرارة المكثف ضعيف جداً');
        
        if (vel_ref_evap < 2) warnings.push('سرعة فريون (بخار) منخفضة - خطر عدم رجوع الزيت');
        if (vel_ref_evap > 8) warnings.push('سرعة فريون عالية - فقد ضغط وتآكل');
        if (airVelocity < 1.2) warnings.push(' سرعة هواء منخفضة جداً');
        if (airVelocity > 5) warnings.push(' سرعة هواء عالية جداً');
        if (U_evap < 20) warnings.push(' انتقال حراري ضعيف في المبخر (U منخفض)');
        if (U_cond < 40) warnings.push(' انتقال حراري ضعيف في المكثف (U منخفض)');
        if (dp_evap_psi > 5) warnings.push(` فقد ضغط المبخر عالي (${dp_evap_psi.toFixed(2)} psi)`);
        if (dp_cond_psi > 5) warnings.push(` فقد ضغط المكثف عالي (${dp_cond_psi.toFixed(2)} psi)`);
        if (realFaceVelEvap > 3) warnings.push(` Face velocity للمبخر عالي (${realFaceVelEvap.toFixed(1)} م/ث)`);
        if (realFaceVelCond > 3) warnings.push(` Face velocity للمكثف عالي (${realFaceVelCond.toFixed(1)} م/ث)`);
        
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

    // ========== الوضع السريع (محسن) ==========
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

    // ========== دالة الحساب الرئيسية ==========
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
            const powerWatt = convertPowerToWatt(powerVal, powerUnit);
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

    // ========== بناء واجهة المستخدم ==========
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
    <!-- السطر الأول: نوع الزعانف فقط -->
    <div>
        <label class="block mb-1 text-sm font-semibold">نوع الزعانف</label>
        <select id="ec_fin_type" style="width:100%;">${finOptions}</select>
    </div>

    <!-- السطر الثاني: مربعا الإدخال متجاورين -->
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

    // ========== ربط الأحداث ==========
    const appSelect = document.getElementById('ec_app');
    const updateDefaults = () => {
        const app = appSelect?.value;
        const def = appData[app];
        if (def) {
            const evapInput = document.getElementById('ec_evap_temp');
            const condInput = document.getElementById('ec_cond_temp');
            const velInput = document.getElementById('ec_air_vel');
            if (evapInput && !evapInput._userChanged) evapInput.value = def.default_evap_temp;
            if (condInput && !condInput._userChanged) condInput.value = def.default_cond_temp;
            if (velInput && !velInput._userChanged) velInput.value = def.default_air_vel;
            clearResult();
        }
    };
    if (appSelect) {
        const evapInput = document.getElementById('ec_evap_temp');
        const condInput = document.getElementById('ec_cond_temp');
        const velInput = document.getElementById('ec_air_vel');
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
}
    
    // ================= أداة حساس NTC =================
    else if (toolId === 'ntc') {
    title.innerText = ' حساس NTC ';
    const ntcTypes = TOOL_CONSTANTS.ntc.types;
    
    // دالة محسنة لعرض المقاومة بمقادير مناسبة
    function formatResistance(r) {
        if (r >= 1e6) return (r / 1e6).toFixed(2) + ' MΩ';
        if (r >= 1e3) return (r / 1e3).toFixed(2) + ' kΩ';
        if (r < 0.01) return r.toExponential(2) + ' Ω';
        if (r < 1) return r.toFixed(3) + ' Ω';
        return r.toFixed(2) + ' Ω';
    }
    
    // دالة Steinhart-Hart (حرارة من مقاومة)
    function steinhartHart(R, A, B, C) {
        const lnR = Math.log(R);
        const invT = A + B * lnR + C * Math.pow(lnR, 3);
        return (1 / invT) - 273.15;
    }
    
    // دالة عكسية لـ Steinhart-Hart (مقاومة من حرارة) باستخدام نيوتن-رافسون
    function steinhartHartInverse(T, A, B, C) {
        const target = 1 / (T + 273.15);
        // تخمين أولي: قيمة مقاومة نموذجية (10kΩ)
        let lnR = Math.log(10000);
        for (let i = 0; i < 100; i++) {
            const f = A + B * lnR + C * Math.pow(lnR, 3) - target;
            const df = B + 3 * C * Math.pow(lnR, 2);
            const delta = f / df;
            lnR -= delta;
            if (Math.abs(delta) < 1e-12) break;
        }
        return Math.exp(lnR);
    }
    
    // معادلة بيتا (حرارة من مقاومة)
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
                // نقرأ R0 و T0 للاستخدام في التخمين الأولي أو في عرض القيم
                T0 = parseFloat(document.getElementById('ntc_t0').value);
                R0 = parseFloat(document.getElementById('ntc_r0').value);
                if (!isFinite(T0) || !isFinite(R0) || R0 <= 0) {
                    showToast('القيم المرجعية (R0, T0) غير صحيحة', 'warning');
                    return;
                }
                B = parseFloat(document.getElementById('ntc_b').value); // قد لا يستخدم
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
            // قيم تقريبية لـ Steinhart-Hart للأنواع الشائعة
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
            
        } else { // res_from_temp
            const t = parseFloat(document.getElementById('ntc_t').value);
            if (!isFinite(t)) {
                showToast('أدخل درجة حرارة صحيحة', 'warning');
                return;
            }
            
            let r;
            if (useSteinhart) {
                // استخدام المعكوس لـ Steinhart-Hart
                r = steinhartHartInverse(t, A, B_sh, C);
            } else {
                // استخدام بيتا
                r = R0 * Math.exp(B * (1 / (t + 273.15) - 1 / T0K));
            }
            
            if (!isFinite(r) || isNaN(r) || r <= 0) {
                showToast('نتيجة غير منطقية (تأكد من المدخلات)', 'error');
                return;
            }
            
            result = {
                'نوع الحساس': type === 'custom' ? 'مخصص' : ntcTypes[type].name,
                'درجة الحرارة': t.toFixed(2) + ' °C',
                'المقاومة': formatResistance(r),
                'المعادلة': useSteinhart ? 'Steinhart-Hart (دقة عالية)' : 'Beta (لحساب المقاومة من الحرارة)'
            };
        }
        
        showFullRes('نتيجة الحساب', result);
    };
    
    // ... (باقي الكود الخاص بإنشاء واجهة المستخدم كما هو، مع التأكد من وجود الحقول المطلوبة)
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
        
        <!-- قسم المخصص لمعادلة Beta -->
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
        
        <!-- قسم المخصص لمعادلة Steinhart-Hart -->
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
    
    // ربط مستمع لتغيير نوع المعادلة
    const equationSelect = document.getElementById('ntc_equation');
    if (equationSelect) {
        equationSelect.addEventListener('change', function() {
            ToolHelpers.updateCustomFieldsOnEquation();
        });
    }
    
    // الإعداد الأولي
    setTimeout(() => { 
        ToolHelpers.ntcToggleCustom();
    }, 50);
}
    
    // ================= أداة PT =================
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
    }
    
    // ================= أداة Superheat/Subcool =================
else if(toolId === 'heat') {
    title.innerText = ' سوبر هيت / صب كول';
    const refrigerantOptions = Object.keys(refPTData)
        .map(r => `<option value="${r}">${r}</option>`).join('');
    
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
        let shValue = null, scValue = null;  // للتشخيص الذكي

        // ---------- وضع Superheat ----------
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

            // قراءة غير منطقية
            if (value < 0) {
                analysis = '?? قراءة غير منطقية (حساس خاطئ أو مكان قياس غير مناسب)';
            }
            // تشخيص متعدد حسب القيمة ونوع النظام
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

            // إضافة تنبيه للفريونات الخليط
            if (['R407C', 'R404A', 'R410A'].includes(refrigerant)) {
                analysis += '\n ملاحظة: فريون خليط – القيم تقريبية وقد تختلف حسب نسبة المكونات.';
            }
        }

        // ---------- وضع Subcooling ----------
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

        // ------------------ التشخيص الذكي (إذا تم حساب القيمتين مسبقاً) ------------------
        // نلاحظ أننا في هذا التصميم نحسب قيمة واحدة فقط حسب التبويب النشط.
        // لكن يمكن تطوير الكود ليدخل المستخدم القيمتين معاً. سنضيف رسالة توجيهية:
        let smartMsg = '';
        if (mode === 'sh' && shValue !== null) {
            // نقرأ قيمة SC من الواجهة (حتى لو مخفية) إن أمكن
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

        // عرض النتيجة
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

    // دالة تبديل الوضع (تضاف لكائن ToolHelpers)
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
        // مسح النتيجة السابقة
        if (typeof clearResult === 'function') clearResult();
    };
}
    
    // ================= أداة معدل التدفق =================
    else if(toolId === 'flow') {
    title.innerText = ' معدل تدفق الهواء AHU';
    
    // الثوابت
    const CFM_TO_M3H = 1.699;
    const BTUH_PER_TON = 12000;
    
    // الحالة
    let mode = 'ton'; // 'ton' or 'load'
    let state = {
        ton: 1.5,
        cfmTon: 400,
        load: 18000,
        dt: 11,
        shr: 0.75
    };
    
    // دوال الحساب
    function calcCFMByTon(ton, cfmTon) {
        return ton * cfmTon;
    }
    
    function calcCFMByLoad(load, dt, shr = 1) {
        const dtF = dt * 1.8; // °C → °F
        return (load * shr) / (1.08 * dtF);
    }
    
    const render = () => {
        setContent(`
            <div class="flex gap-2 mb-3">
                <button id="m1" class="tab-btn ${mode === 'ton' ? 'active' : ''}">حسب الطن</button>
                <button id="m2" class="tab-btn ${mode === 'load' ? 'active' : ''}">حسب الحمل</button>
            </div>
            ${mode === 'ton' ? `
                <label>القدرة (طن)</label>
                <input type="number" step="any" id="f_ton" value="${state.ton}">
                <label>CFM لكل طن (حسب نوع التطبيق)</label>
                <select id="f_cfmTon">
                    <option value="350" ${state.cfmTon === 350 ? 'selected' : ''}>350 (رطوبة عالية - مناطق ساحلية)</option>
                    <option value="400" ${state.cfmTon === 400 ? 'selected' : ''}>400 (قياسي - تكييف مريح)</option>
                    <option value="450" ${state.cfmTon === 450 ? 'selected' : ''}>450 (جاف - مناخ صحراوي)</option>
                </select>
                <label>SHR (نسبة الحمل المحسوس - اختياري)</label>
                <input type="number" step="0.01" id="f_shr_ton" value="${state.shr}" placeholder="0.75">
            ` : `
                <label>الحمل الحراري (BTU/h)</label>
                <input type="number" step="any" id="f_load" value="${state.load}">
                <label>فرق الحرارة ΔT (°C)</label>
                <input type="number" step="any" id="f_dt" value="${state.dt}">
                <label>SHR (نسبة الحمل المحسوس - اختياري)</label>
                <input type="number" step="0.01" id="f_shr_load" value="${state.shr}" placeholder="0.75">
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
                
                // تحديث الحالة
                state.ton = ton;
                state.cfmTon = cfmTon;
                state.shr = shrValue;
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
                
                // تحديث الحالة
                state.load = load;
                state.dt = dt;
                state.shr = shrValue;
            }
            
            // تنبيه ذكي
            if (flow > 3000) {
                showToast(' تنبيه: معدل الهواء مرتفع جداً (>3000 CFM)، راجع حساباتك', 'info');
            } else if (flow < 200 && mode === 'load') {
                showToast('ملاحظة: معدل الهواء منخفض، تأكد من قيم الحمل وΔT', 'info');
            }
            
            const m3h = flow * CFM_TO_M3H;
            
            // بيانات إضافية للنتيجة
            const extraData = {
                'CFM': Math.round(flow),
                'm³/h': Math.round(m3h)
            };
            
            if (mode === 'ton') {
                extraData['نوع التطبيق'] = 
                    state.cfmTon === 350 ? 'رطوبة عالية' : 
                    state.cfmTon === 400 ? 'قياسي' : 'مناخ جاف';
                extraData['CFM/طن'] = state.cfmTon;
            } else {
                extraData['ΔT (°C)'] = state.dt;
                extraData['CFM/طن مقدر'] = Math.round(flow / (state.load / BTUH_PER_TON));
            }
            
            if (shrValue !== 1) {
                extraData['SHR المستخدم'] = shrValue;
            }
            
            showFullRes('معدل تدفق الهواء', extraData);
        });
        
        // ربط الأزرار
        document.getElementById('m1')?.addEventListener('click', () => {
            mode = 'ton';
            clearResult();
            render();
        });
        document.getElementById('m2')?.addEventListener('click', () => {
            mode = 'load';
            clearResult();
            render();
        });
    };
    
    render();
}


else if (toolId === 'refrigerant_charge') {
        title.innerText = ' شحنة الفريون (جرام)';
        const chargePerMeterRealistic = {
            'R410A': { '1/4': 30, '3/8': 65, '1/2': 120, '5/8': 180, '3/4': 250 },
            'R32':   { '1/4': 28, '3/8': 60, '1/2': 110, '5/8': 165, '3/4': 230 },
            'R22':   { '1/4': 35, '3/8': 75, '1/2': 135, '5/8': 200, '3/4': 280 },
            'R134a': { '1/4': 32, '3/8': 70, '1/2': 125, '5/8': 190, '3/4': 260 },
            'R404A': { '1/4': 33, '3/8': 72, '1/2': 128, '5/8': 195, '3/4': 270 },
            'R407C': { '1/4': 34, '3/8': 73, '1/2': 130, '5/8': 198, '3/4': 275 },
            'R290':  { '1/4': 18, '3/8': 38, '1/2': 65,  '5/8': 95,  '3/4': 130 },
            'R600a': { '1/4': 20, '3/8': 42, '1/2': 70,  '5/8': 105, '3/4': 145 }
        };
        
        // 2. الأقطار الداخلية الحقيقية للمواسير النحاسية (مم)
        const innerDiameters = {
            '1/4': 4.8, '3/8': 7.9, '1/2': 11.0, '5/8': 14.0, '3/4': 17.0
        };
        
        // 3. كثافات الغازات عند درجات حرارة تكثيف مختلفة (كجم/م³) للحساب النظري في وضع "كامل"
        const densitiesByTemp = {
            'R410A': { 35: 1030, 40: 950, 45: 880 },
            'R32':   { 35: 920,  40: 850, 45: 790 },
            'R22':   { 35: 1180, 40: 1100,45: 1020 },
            'R134a': { 35: 1150, 40: 1070,45: 990 },
            'R404A': { 35: 1000, 40: 950, 45: 900 },
            'R407C': { 35: 1060, 40: 1000,45: 940 },
            'R290':  { 35: 490,  40: 470, 45: 450 },
            'R600a': { 35: 540,  40: 520, 45: 500 }
        };
        
        // 4. معامل تصحيح حسب نوع النظام
        const systemCorrection = {
            'Split AC': 1.0,
            'Cassette': 1.05,
            'VRF': 1.15,
            'Refrigeration': 1.3,
            'Freezer': 1.4
        };
       
        
        
        let mode = 'simple'; // 'simple', 'precise', 'full'
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
            
            // ربط الأحداث
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
            
            // تحديث أزرار التبويب
            const btnSimple = document.getElementById('modeSimple');
            const btnPrecise = document.getElementById('modePrecise');
            const btnFull = document.getElementById('modeFull');
            if (btnSimple) btnSimple.onclick = () => { mode = 'simple'; clearResult(); renderUI(); };
            if (btnPrecise) btnPrecise.onclick = () => { mode = 'precise'; clearResult(); renderUI(); };
            if (btnFull) btnFull.onclick = () => { mode = 'full'; clearResult(); renderUI(); };
            
            // زر الحساب
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
                        // الطريقة التلقائية باستخدام جدول chargePerMeterRealistic
                        if (!chargePerMeterRealistic[ref] || !chargePerMeterRealistic[ref][diam]) {
                            showToast('لا توجد بيانات حقيقية لهذا الغاز والقطر', 'error');
                            return;
                        }
                        gramPerMeter = chargePerMeterRealistic[ref][diam];
                        extraCharge = gramPerMeter * extraLen;
                        details['طريقة الحساب'] = 'تلقائي (من جدول كتالوجات الشركات)';
                        details['القيمة المعيارية'] = gramPerMeter.toFixed(1) + ' جرام/م';
                    }
                    
                    // تطبيق معامل تصحيح حسب نوع النظام
                    let correction = systemCorrection[system] || 1.0;
                    let extraChargeCorrected = extraCharge * correction;
                    let totalCharge = factoryCharge + extraChargeCorrected;
                    
                    // تطبيق تصحيح درجة الحرارة (تأثير بسيط على الكثافة)
                    let tempCorrection = 1.0;
                    if (densitiesByTemp[ref] && densitiesByTemp[ref][temp]) {
                        let baseDensity = densitiesByTemp[ref][40]; // كثافة عند 40 كمرجع
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
                    
                    // الحصول على الكثافة عند درجة الحرارة المختارة
                    let density = densitiesByTemp[ref]?.[temp];
                    if (!density) {
                        showToast('لا توجد بيانات كثافة لهذا الغاز ودرجة الحرارة', 'error');
                        return;
                    }
                    
                    // حساب حجم الماسورة السائلة (دائماً سائل)
                    let innerDiamLiquid_m = innerDiameters[diamLiquid] / 1000;
                    let areaLiquid = Math.PI * Math.pow(innerDiamLiquid_m / 2, 2);
                    let volumeLiquid = areaLiquid * lenLiquid;
                    let massLiquid = volumeLiquid * density * 1000; // تحويل إلى جرام
                    
                    // حساب حجم الماسورة الغازية
                    let innerDiamGas_m = innerDiameters[diamGas] / 1000;
                    let areaGas = Math.PI * Math.pow(innerDiamGas_m / 2, 2);
                    let volumeGas = areaGas * lenGas;
                    let massGas;
                    if (fullyCharged) {
                        // افتراض أن الغاز مضغوط وكثافته مثل السائل (حالة نادرة)
                        massGas = volumeGas * density * 1000;
                    } else {
                        // الحالة الطبيعية: الماسورة الغازية تحتوي على بخار، كثافته أقل بكثير
                        // نقدر كثافة البخار عند درجة التكثيف (تقريباً 1/20 إلى 1/50 من السائل)
                        let vaporDensity = density * 0.05; // تقريب معقول
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
    }
    

else if (toolId === 'air_velocity') {
    title.innerText = ' تصميم مجاري الهوا';
    
    // ----- الإعدادات الديناميكية حسب نوع المشروع -----
    const PROJECT_LIMITS = {
        res: {   // سكني
            supply: { min: 2.5, max: 4.0, ideal: 3.2 },
            return: { min: 2.0, max: 4.5, ideal: 3.0 },
            exhaust: { min: 2.5, max: 5.0, ideal: 3.5 }
        },
        com: {   // تجاري
            supply: { min: 4.0, max: 6.0, ideal: 5.0 },
            return: { min: 3.0, max: 5.5, ideal: 4.0 },
            exhaust: { min: 3.5, max: 6.0, ideal: 4.5 }
        },
        ind: {   // صناعي
            supply: { min: 5.0, max: 8.0, ideal: 6.5 },
            return: { min: 4.0, max: 7.0, ideal: 5.5 },
            exhaust: { min: 4.5, max: 8.0, ideal: 6.0 }
        }
    };
    
    // دوال مساعدة

    
    // تحويل الوحدات
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
        // ----- قراءة المدخلات العامة -----
        let flow = parseFloat(document.getElementById('av_flow').value);
        let flowUnit = document.getElementById('av_flow_unit').value;
        if (isNaN(flow) || flow <= 0) { showToast('أدخل تدفقاً صحيحاً (>0)', 'warning'); return; }
        let cfm = toCFM(flow, flowUnit);
        let m3s = cfm * 0.000471947;   // m³/s
        
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
        let resultArea = null;       // للوضع size
        
        // ----- التحقق من الأبعاد أو المساحة أو السرعة المستهدفة -----
        if (calcMode === 'velocity') {
            // وضع حساب السرعة
            const useAreaDirect = document.getElementById('av_use_area_direct').checked;
            if (ductShape === 'rect') {
                if (useAreaDirect) {
                    // استخدام المساحة المباشرة
                    let areaVal = parseFloat(document.getElementById('av_area').value);
                    let areaUnit = document.getElementById('av_area_unit').value;
                    if (!isNaN(areaVal) && areaVal > 0) {
                        areaM2 = toM2(areaVal, areaUnit);
                        hydraulicDiameter = null; // غير معروف بدون أبعاد
                    } else {
                        showToast(' أدخل مساحة صحيحة (>0)', 'warning');
                        return;
                    }
                } else {
                    // استخدام الأبعاد
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
            } else { // دائري
                let diam_mm = parseFloat(document.getElementById('av_diameter').value);
                if (!isNaN(diam_mm) && diam_mm > 0) {
                    let diam_m = diam_mm / 1000;
                    areaM2 = Math.PI * Math.pow(diam_m / 2, 2);
                    hydraulicDiameter = diam_m;
                } else {
                    // إذا لم يحدد المستخدم القطر، نحاول استخدام المساحة المباشرة إن كانت متاحة
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
        } 
        else { // mode = size : حساب المقاس المطلوب من السرعة
            let targetVel = parseFloat(document.getElementById('target_velocity').value);
            if (isNaN(targetVel) || targetVel <= 0) {
                showToast(' أدخل سرعة مستهدفة صحيحة (>0)', 'warning');
                return;
            }
            velocity_ms = targetVel;
            resultArea = m3s / velocity_ms;   // المساحة المطلوبة بالمتر المربع
            
            if (resultArea <= 0 || !isFinite(resultArea)) {
                showToast(' قيم التدفق أو السرعة تؤدي لمساحة غير منطقية', 'error');
                return;
            }
            areaM2 = resultArea;
            // اقتراح أبعاد تقريبية (مستطيل أو قطر)
        }
        
        // ----- تحذيرات Validation إضافية -----
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
        
        // ----- التوصيات والتحذيرات المحسنة -----
        let recommendation = '';
        let noiseWarning = '';
        let pressureWarning = '';
        let smartSuggestion = '';
        
        // تقييم السرعة
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
        
        // اقتراح ذكي إذا كانت السرعة عالية جداً
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
        
        // نتيجة إضافية للوضع size: عرض مقاسات مقترحة
        let sizeResultExtra = '';
        if (calcMode === 'size') {
            let suggestedWidth = Math.sqrt(resultArea);
            let suggestedHeight = suggestedWidth; // مربع
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
        
        // عرض النتائج الرئيسية
        let resultObj = {
            ' طريقة الحساب': calcMode === 'velocity' ? 'حساب السرعة من الأبعاد' : 'حساب المقاس من السرعة المطلوبة',
            ' معدل التدفق': `${round0(cfm)} CFM (${round0(flow)} ${flowUnit === 'cfm' ? 'CFM' : 'm³/h'})`,
            'نوع المشروع / الهواء': `${projectType === 'res' ? 'سكني' : projectType === 'com' ? 'تجاري' : 'صناعي'} / ${airType === 'supply' ? 'Supply' : airType === 'return' ? 'Return' : 'Exhaust'}`,
            ' مساحة المقطع (م²)': round4(areaM2),
            ' شكل الدكت': ductShape === 'rect' ? 'مستطيل' : 'دائري',
        };
        
        // إضافة hydraulic diameter لو موجود
        if (hydraulicDiameter !== null && hydraulicDiameter > 0) {
            resultObj[' القطر الهيدروليكي (م)'] = round3(hydraulicDiameter);
        }
        
        resultObj[' السرعة'] = `${round2(velocity_ms)} م/ث   |   ${round0(velocity_ms * 196.85)} قدم/دقيقة`;
        resultObj[' التوصية'] = recommendation;
        if (noiseWarning) resultObj[' تحذير الضوضاء'] = noiseWarning;
        if (pressureWarning) resultObj[' فقد الضغط التقريبي'] = pressureWarning;
        if (smartSuggestion) resultObj['اقتراح تحسين'] = smartSuggestion;
        
        // إضافة حقل الأبعاد إن وجدت (فقط في وضع velocity والأبعاد المستخدمة)
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
        
        // دالة round إضافية للدقة
        function round4(v) { return Math.round(v * 10000) / 10000; }
        function round3(v) { return Math.round(v * 1000) / 1000; }
        
        showFullRes('نتائج تصميم مجرى الهواء', resultObj, sizeResultExtra);
    });
    
    // ----- ربط أحداث الإظهار والإخفاء بعد تحميل المحتوى -----
    setTimeout(() => {
        const modeSelect = document.getElementById('calc_mode');
        const velocitySection = document.getElementById('mode_velocity_section');
        const sizeSection = document.getElementById('mode_size_section');
        const roundSection = document.getElementById('round_dim_section');
        const ductShape = document.getElementById('duct_shape');
        const useAreaCheckbox = document.getElementById('av_use_area_direct');
        const dimDiv = document.getElementById('av_dimensions_div');
        const areaDiv = document.getElementById('av_area_div');
        
        // تبديل وضع الحساب (سرعة / مقاس)
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
        
        // إظهار/إخفاء حقل القطر حسب شكل الدكت
        if (ductShape) {
            const toggleRound = () => {
                roundSection.style.display = (ductShape.value === 'round') ? 'block' : 'none';
                clearResult();
            };
            ductShape.addEventListener('change', toggleRound);
            toggleRound();
        }
        
        // تبديل إدخال المساحة المباشرة ↔ الأبعاد
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
            toggleAreaDimensions(); // تشغيل أولي
        }
        
        // ربط مسح النتيجة عند تغيير أي من حقول الإدخال الرئيسية
        const inputs = ['av_flow', 'av_flow_unit', 'project_type', 'av_air_type', 'duct_shape', 'av_width', 'av_height', 'av_area', 'av_area_unit', 'av_diameter', 'target_velocity'];
        inputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('input', clearResult);
        });
    }, 50);
}
    
    
    else if (toolId === 'pressure_diagnosis') {
    title.innerText = ' تشخيص الضغوط والكهرباء';
    const refrigerants = Object.keys(refPTData);
    
    // حدود مرجعية للفريونات (نسبة الضغط العالية)
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
        
        // مصفوفة التشخيصات (مع权重)
        let diagnoses = [];
        
        // 1. أعطال الشحن (مع权重)
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
        
        // 2. أعطال الكابلري / TXV (مع وزن وتمييز حسب النظام)
        if (systemType === 'capillary') {
            if (pressureRatio < 2.8 && superheat > 18 && subcool > 12 && suction < 40) {
                diagnoses.push({ text: ' انسداد شبه كامل في الأنبوبة الشعرية أو فلتر الدراير', weight: 10, reasons: ['ضغط سحب منخفض جداً، حرارة محمصة عالية، تبريد تحت تبريد مرتفع'], steps: ['تفقد الفلتر دراير - إذا كان بارداً من جهة وساخناً من أخرى فهو مسدود، استبدله مع تنظيف الأنبوبة'] });
            }
            else if (pressureRatio < 3.2 && superheat > 14 && subcool > 10) {
                diagnoses.push({ text: ' انسداد جزئي في الكابلري أو الفلتر', weight: 8, reasons: ['نسبة ضغط منخفضة نسبياً مع سوبرهيت عالي وسوبكول متوسط إلى مرتفع'], steps: ['قياس درجة حرارة الفلتر دراير - فارق حرارة > 3°C يدل على انسداد، غيّره'] });
            }
        } else { // TXV
            if (superheat < 2 && subcool > 14 && pressureDiff > 220) {
                diagnoses.push({ text: ' صمام تمدد حراري TXV عالق في وضع مفتوح بالكامل أو حساسه منفصل', weight: 9, reasons: ['سوبرهيت شبه معدوم (خطر رجوع سائل) مع سوبكول مرتفع'], steps: ['افحص حساس TXV، نظف رأس الصمام، إذا لم يتحسن فاستبدل الصمام'] });
            }
            else if (superheat > 25 && subcool < 6 && pressureRatio > limits.ratioHigh) {
                diagnoses.push({ text: 'صمام تمدد TXV عالق في وضع مغلق أو شبكة الحساس مسدودة', weight: 9, reasons: ['سوبرهيت عالٍ جداً وسوبكول منخفض'], steps: ['افحص ضبط TXV، تأكد من عدم وجود هواء في الحساس، غطِّ الحساس بيدك - يجب أن يزيد التدفق'] });
            }
        }
        
        // 3. أعطال المبادلات الحرارية
        if (evapTemp < -5 && superheat < 4) {
            diagnoses.push({ text: ' تجمد المبخر بسبب ضعف تدفق الهواء أو عطل مروحة', weight: 8, reasons: [`درجة تبخير ${evapTemp.toFixed(1)}°C أقل من نقطة التجمد وسوبرهيت منخفض جداً`], steps: ['نظف فلتر الهواء، تأكد من عمل المروحة، ارفع الإعداد الحراري مؤقتاً'] });
        }
        else if (evapTemp > 12 && superheat < 4 && suction > 70) {
            diagnoses.push({ text: ' حمل حراري عالٍ جداً على المبخر (غاز ساخن عائد)', weight: 7, reasons: ['درجة تبخير مرتفعة (>12°C) وسوبرهيت شبه منخفض'], steps: ['تأكد من عدم وجود فتحات تهوية غريبة، فحص حجم المبخر'] });
        }
        
        // condSplit محسّن
        if (condSplit > 20) {
            diagnoses.push({ text: 'مكثف متسخ أو مروحة ضعيفة (اتساخ شديد)', weight: 8, reasons: [`فرق حرارة التكثيف ${condSplit.toFixed(1)}°C > 20 (طبيعي <15)`], steps: ['نظف المكثف بالماء والضغط، وتأكد من دوران المروحة بالاتجاه الصحيح'] });
        }
        else if (condSplit > 15) {
            diagnoses.push({ text: ' بداية اتساخ المكثف أو ضعف طفيف في المراوح', weight: 5, reasons: [`فرق حرارة التكثيف ${condSplit.toFixed(1)}°C بين 15 و20`], steps: ['افحص نظافة المكثف، اختبر تيار المروحة'] });
        }
        
        // 4. أعطال الضاغط
        if ((suction > 75 && discharge < 180) || (pressureRatio < 2.5 && discharge < 170)) {
            diagnoses.push({ text: ' ضعف كفاءة الضاغط (تآكل الصمامات الداخلية)', weight: 9, reasons: ['ضغط سحب مرتفع وضغط طرد منخفض - لا يبني فرق ضغط كاف'], steps: ['افحص الضاغط عن طريق اختبار الأمبير والمقارنة مع RLA، قياس ضغط الزيت، استبدل الضاغط إذا لزم الأمر'] });
        }
        
        // ربط التيار بالضغوط
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
        
        // 5. هواء ورطوبة
        if (discharge > 400 && subcool > 18 && condSplit > 25) {
            diagnoses.push({ text: 'وجود هواء أو غازات غير قابلة للتكثيف في الدائرة', weight: 9, reasons: ['ضغط طرد مرتفع جداً مع سوبكول عالي وفرق تكثيف كبير'], steps: ['قم بتفريغ النظام بالكامل، عمل فاكيوم عميق، ثم إعادة شحن الفريون'] });
        }
        if (subcool > 20 && pressureRatio > limits.ratioHigh && superheat < 3) {
            diagnoses.push({ text: ' رطوبة في الدائرة (تتجمد في صمام التمدد)', weight: 8, reasons: ['سوبرهيت يتذبذب وسوبكول مرتفع - مؤشر على تجمد جزئي'], steps: ['استبدل فلتر الدراير بآخر مزيل رطوبة، ثم فاكيوم طويل'] });
        }
        
        // 6. مشاكل تدفق الهواء على المبخر
        if (suction < 25 && superheat > 18 && (condTemp - ambient) < 12) {
            diagnoses.push({ text: ' ضعف تدفق الهواء على المبخر أو مبخر متجمد', weight: 7, reasons: ['ضغط سحب منخفض + سوبرهيت مرتفع + تكثيف طبيعي'], steps: ['افحص مراوح المبخر، ازالة الجليد، تنظيف الفلاتر'] });
        }
        
        // 7. أعطال كهربائية أخرى (عدم توازن فازات)
        if (current > 0 && (suction > 50 && discharge > 200 && pressureRatio < 4.5 && superheat > 8 && subcool < 6)) {
            diagnoses.push({ text: ' عدم توازن الفازات (ثلاثة فاز) أو انخفاض الجهد', weight: 7, reasons: ['ضغوط شبه طبيعية لكن التيار مرتفع'], steps: ['قياس الفولت بين الفازات، يجب ألا يزيد الفرق عن 2%، تحسين التغذية الكهربائية'] });
        }
        
        // 8. صمام رباعي
        if (discharge - suction < 70 && discharge > 150 && suction > 50) {
            diagnoses.push({ text: ' خلل في صمام الانعكاس (رباعي الاتجاه)', weight: 8, reasons: ['فرق ضغط منخفض بين الطرد والسحب على الرغم من وجود ضغوط متوسطة'], steps: ['اختبر الصمام بالقرع عليه، قد يكون عالقاً، بدّل ملف الصمام أو الصمام نفسه'] });
        }
        
        // إذا لم يوجد أي تشخيص
        if (diagnoses.length === 0) {
            diagnoses.push({ text: ' النظام يعمل بشكل طبيعي', weight: 0, reasons: ['جميع القراءات ضمن النطاقات الطبيعية'], steps: ['لا توجد إجراءات مطلوبة، يمكن إجراء صيانة دورية'] });
        }
        
        // ترتيب حسب الوزن وأخذ الأفضل
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

// إضافة الخاصية فقط إذا كانت موجودة
if (result.otherDiagnoses !== 'لا يوجد') {
    resultObj['تشخيصات أخرى محتملة'] = result.otherDiagnoses;
}

showFullRes(' تقرير تشخيص ضغوط وكهرباء النظام', resultObj);
    };
    
    // واجهة المستخدم
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
}
// ================= أداة حساب التهوية وتحديد سعة المراوح (Pro Max v2) =================
else if (toolId === 'ventilation') {
    title.innerText = ' حساب التهوية وتحديد سعة المراوح ';

    // -------------------- الثوابت المحسنة --------------------
    const M3H_TO_CFM = 0.588577;
    const DEFAULT_FAN_EFF = 0.65;
    const STANDARD_AIR_DENSITY_20C = 1.204;   // kg/m³ عند 20°C
    const SYSTEM_EFFECT_FACTOR = 1.1;         // يعوض الاضطرابات وخسائر الدخول/الخروج
    const PRESSURE_MARGIN = 20;               // Pa احتياطي للتسخ أو زيادة الفواقد مستقبلاً
    
    // أنواع الأماكن المحسنة
    const SPACE_TYPES = {
        'living':     { name: 'غرفة معيشة / نوم', ach_min: 4, ach_max: 6, default_ach: 5, category: 'residential' },
        'office':     { name: 'مكتب / إداري', ach_min: 6, ach_max: 8, default_ach: 7, category: 'commercial' },
        'kitchen_home': { name: 'مطبخ منزلي', ach_min: 12, ach_max: 18, default_ach: 15, category: 'residential' },
        'kitchen_rest': { name: 'مطبخ مطعم / كافيتيريا', ach_min: 25, ach_max: 40, default_ach: 30, category: 'commercial' },
        'kitchen_ind':  { name: 'مطبخ صناعي (مطاعم كبيرة)', ach_min: 40, ach_max: 60, default_ach: 50, category: 'industrial' },
        'bath_home':  { name: 'حمام منزلي', ach_min: 8, ach_max: 12, default_ach: 10, category: 'residential' },
        'bath_pub':   { name: 'حمام عام (مول، محطة)', ach_min: 15, ach_max: 25, default_ach: 20, category: 'commercial' },
        'workshop_light': { name: 'ورشة خفيفة (نجارة، ميكانيكا)', ach_min: 10, ach_max: 15, default_ach: 12, category: 'industrial' },
        'workshop_heavy': { name: 'ورشة ثقيلة (دهان، لحام، كيماويات)', ach_min: 20, ach_max: 30, default_ach: 25, category: 'industrial' },
        'warehouse_dry': { name: 'مخزن جاف (مواد جافة)', ach_min: 4, ach_max: 6, default_ach: 5, category: 'commercial' },
        'warehouse_cold':{ name: 'مخزن مبرد / تبريد', ach_min: 10, ach_max: 20, default_ach: 15, category: 'industrial' },
        'parking':    { name: 'جراج / موقف سيارات مغلق', ach_min: 6, ach_max: 10, default_ach: 8, category: 'commercial' }
    };
    
    // خسائر الفلاتر
    const FILTER_LOSS_RANGE = {
        'none': { min: 0, max: 0, default: 0 },
        'standard': { min: 30, max: 80, default: 55 },
        'hepa': { min: 100, max: 250, default: 175 }
    };
    
    // معامل الاحتكاك (f) ثابت حسب نوع الدكت - دقة عملية ممتازة
    const DUCT_FRICTION_FACTOR = {
        'rigid': 0.02,      // صاج مجلفن أملس
        'flexible': 0.04    // فليكس (مرن)
    };
    
    // سرعات هواء افتراضية حسب فئة المكان
    const ASSUMED_VELOCITY_BY_CATEGORY = {
        'residential': 3.0,
        'commercial': 5.0,
        'industrial': 7.0
    };
    
    let activeMode = 'simple';
    
    // -------------------- دوال حسابية محسنة --------------------
    function calculateVolume(length, width, height) {
        if (isNaN(length) || isNaN(width) || isNaN(height)) return NaN;
        return length * width * height;
    }
    
    function calculateAirflow(volume_m3, ach) {
        if (volume_m3 <= 0 || ach <= 0) return NaN;
        return volume_m3 * ach;
    }
    
    // كثافة الهواء كدالة في درجة الحرارة
    function getAirDensity(tempCelsius) {
        if (isNaN(tempCelsius)) return STANDARD_AIR_DENSITY_20C;
        let density = 1.204 - (tempCelsius - 20) * 0.004;
        return Math.max(density, 1.05);
    }
    
    // سرعة هواء مفترضة حسب نوع المكان
    function getAssumedVelocityBySpace(spaceTypeKey) {
        if (spaceTypeKey && SPACE_TYPES[spaceTypeKey]) {
            let cat = SPACE_TYPES[spaceTypeKey].category;
            return ASSUMED_VELOCITY_BY_CATEGORY[cat] || 4.0;
        }
        return 4.0;
    }
    
    // حساب فقد المجرى (Darcy-Weisbach مع f ثابت)
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
    
    // حساب خسائر الأكواع (مع K متغير حسب نوع الدكت)
    function calculateElbowLoss(elbowsCount, velocity_m_s, ductType, rho) {
        if (elbowsCount <= 0) return 0;
        let K_elbow = (ductType === 'flexible') ? 1.2 : 0.75;
        let dynamicPressure = 0.5 * rho * velocity_m_s * velocity_m_s;
        return elbowsCount * K_elbow * dynamicPressure;
    }
    
    // حساب المعاملات المتقدمة مع تطبيق الأمان على Q فقط
    function calculateAdvancedParams(Q_m3h_safe, ductLength_m, ductDiameter_mm, elbowsCount, filterValue, ductType, spaceTypeKey, ambientTemp) {
        let Q_m3s = Q_m3h_safe / 3600;   // هنا Q_m3h_safe مطبق عليه معامل الأمان بالفعل
        let rho = getAirDensity(ambientTemp);
        
        // تقدير السرعة والقطر إن لزم
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
        
        // فقد المجرى
        let ductLoss = calculateDuctLoss(Q_m3h_safe, usedDiameter, ductLength_m, ductType, rho);
        
        // فقد الأكواع
        let elbowLoss = calculateElbowLoss(elbowsCount, velocity, ductType, rho);
        
        // فقد الفلتر
        let filterLoss = filterValue;
        
        // الضغط الاستاتيكي الكلي + هامش الأمان (20 Pa)
        let staticPressure = ductLoss + elbowLoss + filterLoss + PRESSURE_MARGIN;
        staticPressure = Math.max(staticPressure, 0);
        
        // حساب القدرة (مع تطبيق System Effect Factor)
        let fanPowerWatts = (staticPressure * Q_m3s) / DEFAULT_FAN_EFF;
        fanPowerWatts = fanPowerWatts * SYSTEM_EFFECT_FACTOR;
        
        return {
            staticPressure,
            fanPowerWatts,
            velocity,
            ductLoss,
            elbowLoss,
            usedDiameter
        };
    }
    
    // اختيار نوع المروحة
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
    
    // -------------------- دالة الحساب الرئيسية --------------------
    const calculateVentilation = () => {
        // قراءة المدخلات الأساسية
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
        
        // قراءة ACH
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
        
        // معامل الأمان (يطبق على Q فقط)
        let safety = parseFloat(document.getElementById('vent_safety')?.value);
        if (isNaN(safety) || safety < 1.0) safety = 1.0;
        if (safety > 1.5) safety = 1.5;
        
        // درجة الحرارة المحيطة
        let ambientTemp = parseFloat(document.getElementById('vent_ambient_temp')?.value);
        if (isNaN(ambientTemp)) ambientTemp = 20;
        ambientTemp = Math.min(Math.max(ambientTemp, -10), 50);
        
        let mode = document.querySelector('#modalBody .phase-option.selected[data-vent-mode]')?.dataset.ventMode || 'simple';
        
        // حساب Q الأساسي
        let Q_m3h = calculateAirflow(volume, ach);
        if (isNaN(Q_m3h) || Q_m3h <= 0) {
            showToast('قيم غير صالحة للحساب', 'error');
            return;
        }
        let Q_cfm = Q_m3h * M3H_TO_CFM;
        
        // تطبيق معامل الأمان على Q فقط
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
            // قراءة المعاملات المتقدمة
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
            
            // حساب المعاملات المتقدمة (Q_safe_m3h تم تطبيق الأمان عليه)
            let adv = calculateAdvancedParams(
                Q_safe_m3h, ductLength, ductDiameter, elbows, filterValue, ductType, spaceType, ambientTemp
            );
            
            let fanType = recommendFanType(Q_safe_m3h, adv.staticPressure);
            let airDensity = getAirDensity(ambientTemp);
            
            results['درجة حرارة الهواء'] = `${ambientTemp}°C`;
            results['كثافة الهواء المستخدمة'] = `${airDensity.toFixed(3)} kg/m³`;
            results['طول مجرى الهواء (م)'] = ductLength.toFixed(1);
            results['قطر الدكت (مم)'] = (ductDiameter > 0) ? ductDiameter.toFixed(0) : `${adv.usedDiameter.toFixed(0)} (مُقدَّر)`;
            results['القطر المقترح للدكت (مم)'] = adv.usedDiameter.toFixed(0);  // ميزة جديدة
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
            
            // تحذير ذكي: طول دكت كبير مع قطر صغير
            if (ductLength > 30 && adv.usedDiameter < 200) {
                warnings.push(` طول الدكت كبير (${ductLength} م) مع قطر صغير (${adv.usedDiameter.toFixed(0)} مم) → فقد ضغط عالي جدًا، يفضل زيادة القطر إلى ${Math.min(Math.round(adv.usedDiameter * 1.3), 500)} مم على الأقل.`);
            }
            
            // تحذيرات إضافية
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
    
    // -------------------- بناء واجهة المستخدم --------------------
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
                    <label>قيم ACU حسب المكان </label>
                    <select id="vent_space_type" class="w-full">
                        <option value="">-- اختر نوع المكان (إن أردت) --</option>
                        ${spaceTypesOptions}
                    </select>
                </div>
                
                <div>
    <label>طريقة إدخال ACH (عدد مرات تغيير الهواء في الساعة)</label>
    <div class="flex gap-2">
        <label class="flex-1 text-center"><input type="radio" name="vent_ach_mode" class ="inpchk" value="auto" checked> تلقائي</label>
        <label class="flex-1 text-center"><input type="radio" name="vent_ach_mode" class ="inpchk" value="manual"> إدخال يدوي</label>
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
            // تبديل الحجم المباشر
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
            
            // تبديل وضع Achh
            const autoRadio = document.querySelector('input[name="vent_ach_mode"][value="auto"]');
const manualRadio = document.querySelector('input[name="vent_ach_mode"][value="manual"]');
const manualAchContainer = document.getElementById('vent_ach_manual_container');
const manualAchInput = document.getElementById('vent_ach_manual');
const spaceTypeSelect = document.getElementById('vent_space_type');

const updateAchMode = () => {
    if (autoRadio && autoRadio.checked) {
        // إخفاء مربع الإدخال اليدوي
        if (manualAchContainer) manualAchContainer.style.display = 'none';
        // تعيين القيمة التلقائية إذا كان نوع المكان محدداً
        if (spaceTypeSelect && spaceTypeSelect.value && SPACE_TYPES[spaceTypeSelect.value]) {
            manualAchInput.value = SPACE_TYPES[spaceTypeSelect.value].default_ach;
        } else {
            manualAchInput.value = '';
        }
    } else if (manualRadio && manualRadio.checked) {
        // إظهار مربع الإدخال اليدوي
        if (manualAchContainer) manualAchContainer.style.display = 'block';
        // تفريغ القيمة إذا كانت مساوية للقيمة التلقائية
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

// ربط الأحداث
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
// استدعاء أولي
updateAchMode();
            
            // إظهار/إخفاء حقل الفلتر اليدوي
            const filterSelect = document.getElementById('vent_filter');
            const filterManualDiv = document.getElementById('vent_filter_manual_div');
            if (filterSelect && filterManualDiv) {
                filterSelect.onchange = () => {
                    filterManualDiv.style.display = (filterSelect.value === 'manual') ? 'block' : 'none';
                    clearResult();
                };
                if (filterSelect.value === 'manual') filterManualDiv.style.display = 'block';
            }
            
            // ربط أزرار التبديل بين الوضعين
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
            
            // ربط مسح النتيجة
            const allInputs = document.querySelectorAll('#modalBody input, #modalBody select');
            allInputs.forEach(inp => {
                inp.removeEventListener('change', clearResult);
                inp.removeEventListener('input', clearResult);
                inp.addEventListener('change', clearResult);
                inp.addEventListener('input', clearResult);
            });
            
            // ربط زر الحساب
            const calcButton = document.getElementById('calculateBtn');
            if (calcButton) {
                calcButton.style.display = 'flex';
                calcButton.onclick = () => withLoading(calcButton, calculateVentilation);
            }
        }, 30);
    };
    
    renderUI();
}
//ادوات الكهرباء 
else if (toolId === 'energy') {
    title.innerText = ' تكلفة الطاقة (متقدم)';
    
    // بيانات الأجهزة الشائعة (واط)
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
    
    // شرائح الكهرباء المصرية
    const tiers = [
        { min: 0, max: 50, price: 0.48, name: 'شريحة 1 (0-50 kWh)' },
        { min: 51, max: 100, price: 0.58, name: 'شريحة 2 (51-100 kWh)' },
        { min: 101, max: 200, price: 0.77, name: 'شريحة 3 (101-200 kWh)' },
        { min: 201, max: 350, price: 1.09, name: 'شريحة 4 (201-350 kWh)' },
        { min: 351, max: 650, price: 1.42, name: 'شريحة 5 (351-650 kWh)' },
        { min: 651, max: 1000, price: 1.57, name: 'شريحة 6 (651-1000 kWh)' },
        { min: 1001, max: Infinity, price: 1.63, name: 'شريحة 7 (أكثر من 1000 kWh)' }
    ];
    
    // دالة تقريب

    
    // بناء قائمة الأجهزة
    let applianceOptions = '<option value="">-- اختر جهازاً --</option>';
    for (let [name, watt] of Object.entries(appliances)) {
        applianceOptions += `<option value="${name}">${name} (${watt} واط)</option>`;
    }
    
    // واجهة المستخدم (بدون أي تداخل خطير للـ backticks)
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
        // ---- قراءة المدخلات ----
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
        
        // ساعات التشغيل
        let hours_raw = parseFloat(document.getElementById('en_h').value);
        const daysUnit = document.getElementById('days_unit').value;
        if (isNaN(hours_raw) || hours_raw <= 0) {
            showToast('أدخل ساعات تشغيل صحيحة', 'warning');
            return;
        }
        let hours_per_day = hours_raw;
        if (daysUnit === 'week') hours_per_day = hours_raw / 7;
        else if (daysUnit === 'month') hours_per_day = hours_raw / 30;
        
        // السعر
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
        
        // البصمة الكربونية (0.5 كجم CO2 لكل kWh - متوسط مصر)
        const co2_kg = total_kwh * 0.5;
        const co2_tons = co2_kg / 1000;
        const trees_needed = Math.ceil(co2_tons * 45); // 45 كجم لكل شجرة سنوياً
        
        // نصائح توفير الطاقة
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
        
        // مقارنة بسيطة
        let comparison = '';
        if (power_w > 200) {
            const ledCount = Math.floor(power_w / 12);
            comparison = ` استهلاك هذا الجهاز يعادل ${ledCount} لمبة LED (12 واط) تعمل لنفس المدة.`;
        }
        
        // تجهيز كائن النتائج
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
        
        if (trees_needed > 0) {
            results[' تعويض الكربون'] = `تحتاج زراعة ≈ ${trees_needed} شجرة سنوياً`; }
        if (comparison) {
            results[' مقارنة'] = comparison;   }
        showFullRes(` تكلفة الكهرباء - ${periodName}`, results);
        if (tips.length) {
            const tipsHtml = `<div class="saving-tip" style="background:#dcfce7; border-right:4px solid #22c55e; padding:10px; margin-top:10px; border-radius:8px;"><strong> نصائح توفير الطاقة:</strong><br>${tips.map(t => '• ' + t).join('<br>')}</div>`;
            const resDiv = document.getElementById('resultDisplay');
            if (resDiv) resDiv.insertAdjacentHTML('beforeend', tipsHtml); }
    });
    
    // ---- إضافة أحداث التبديل الديناميكي (آمنة) ----
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
            toggleMethod();   }
        
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
}
    


else if (toolId === 'wire') { 
    title.innerText = '  الكابلات الكهربائية';
    
    // ----- جداول الـ Ampacity (تحمل التيار) حسب NEC -----
    const AMPACITY_TABLE = {
        cu: {   // نحاس 75°C
            1.5: 15, 2.5: 21, 4: 28, 6: 36, 10: 50, 16: 68, 25: 89, 35: 110,
            50: 133, 70: 171, 95: 207, 120: 239, 150: 275, 185: 312, 240: 369
        },
        al: {   // ألمنيوم 75°C
            2.5: 18, 4: 24, 6: 31, 10: 42, 16: 57, 25: 74, 35: 92,
            50: 112, 70: 144, 95: 174, 120: 201, 150: 232, 185: 263, 240: 311
        }
    };
    
    const RESISTIVITY_20 = {
        cu: 0.01724,      // نحاس
        al: 0.0282,       // ألمنيوم
        fe: 0.10,         // حديد
        ag: 0.0159,       // فضة
        gold: 0.0244,     // ذهب
        brass: 0.07       // نحاس أصفر
    };
    
    const INSTALLATION_FACTOR = { air: 1.0, conduit: 0.8, buried: 0.9 };
    
    let currentMode = 'wire_sizing'; // 'wire_sizing' or 'voltage_drop'
    let lengthType = 'one_way'; // 'one_way' or 'round_trip'
    
    window.getNearestStdArea = function(area, stdSizes = null) {
        if (!stdSizes) stdSizes = Object.keys(AMPACITY_TABLE.cu).map(Number).sort((a,b) => a-b);
        if (area <= stdSizes[0]) return stdSizes[0];
        for (let i = 0; i < stdSizes.length; i++) {
            if (stdSizes[i] >= area) return stdSizes[i];
        }
        return stdSizes[stdSizes.length - 1];
    };
    
    const onModeChange = () => {
        const select = document.getElementById('wire_mode_select');
        if (select) {
            currentMode = select.value;
            const sizingDiv = document.getElementById('wire_sizing_fields');
            const vdropDiv = document.getElementById('voltage_drop_fields');
            if (sizingDiv && vdropDiv) {
                sizingDiv.style.display = (currentMode === 'wire_sizing') ? 'block' : 'none';
                vdropDiv.style.display = (currentMode === 'voltage_drop') ? 'block' : 'none';
            }
            if (typeof clearResult === 'function') clearResult();
        }
    };
    
    const onLengthTypeChange = () => {
        const select = document.getElementById('length_type_select');
        if (select) {
            lengthType = select.value;
            if (typeof clearResult === 'function') clearResult();
            // تحديث النص التوضيحي
            const lengthHint = document.getElementById('length_hint');
            if (lengthHint) {
                if (lengthType === 'one_way') {
                    lengthHint.innerHTML = 'ملاحظة: الطول من الموزع إلى الحمل (ذهاب فقط)';
                } else {
                    lengthHint.innerHTML = 'ملاحظة: الطول الكلي للكابل (ذهاب + عودة) - سيقسم تلقائياً حسب نوع التيار';
                }
            }
        }
    };
    
    const renderWireUI = () => {
        let html = `
            <!-- اختيار طريقة الحساب -->
            <label> طريقة الحساب</label>
            <select id="wire_mode_select" class="w-full mb-3">
                <option value="wire_sizing" ${currentMode === 'wire_sizing' ? 'selected' : ''}> مقطع السلك</option>
                <option value="voltage_drop" ${currentMode === 'voltage_drop' ? 'selected' : ''}> هبوط الجهد</option>
            </select>
            
            <!-- الحقول المشتركة -->
            <label> التيار (أمبير)</label>
            <input type="number" step="any" id="w_a" value="20" class="w-full">
            
            <!-- اختيار طريقة إدخال الطول -->
            <label> نوع طول الكابل</label>
            <select id="length_type_select" class="w-full mb-1">
                <option value="one_way" ${lengthType === 'one_way' ? 'selected' : ''}>طول الذهاب فقط (من الموزع إلى الحمل)</option>
                <option value="round_trip" ${lengthType === 'round_trip' ? 'selected' : ''}>الطول الكلي (ذهاب + عودة)</option>
            </select>
            
            <label> طول السلك (متر)</label>
            <input type="number" step="any" id="w_l" value="30" class="w-full">
            <div class="text-xs text-gray-500" id="length_hint">
                ${lengthType === 'one_way' ? 'ملاحظة: الطول من الموزع إلى الحمل (ذهاب فقط)' : 'ملاحظة: الطول الكلي للكابل (ذهاب + عودة) - سيقسم تلقائياً حسب نوع التيار'}
            </div>
            
            <label>الجهد (فولت)</label>
            <input type="number" step="any" id="w_voltage" value="230" class="w-full">
            
            <label> درجة الحرارة المحيطة (°C)</label>
            <input type="number" step="any" id="w_temp" value="30" class="w-full">
            
            <label> نوع التيار</label>
            <select id="wire_phase_select" class="w-full">
                <option value="single">فاز واحد (220V)</option>
                <option value="three">ثلاثة فاز (380V)</option>
            </select>
            
            <label> مادة السلك</label>
            <select id="wire_material_select" class="w-full">
                <option value="cu">نحاس (Copper)</option>
                <option value="al">ألمنيوم (Aluminum)</option>
                <option value="fe">حديد (Iron)</option>
                <option value="ag">فضة (Silver)</option>
                <option value="gold">ذهب (Gold)</option>
                <option value="brass">نحاس أصفر (Brass)</option>
            </select>
            
            <label> طريقة التمديد</label>
            <select id="install_method" class="w-full">
                <option value="air">في الهواء الحر</option>
                <option value="conduit">داخل ماسورة</option>
                <option value="buried">مدفون مباشرة</option>
            </select>
            
            <!-- حقول خاصة بوضع حساب مقطع السلك -->
            <div id="wire_sizing_fields" style="display: ${currentMode === 'wire_sizing' ? 'block' : 'none'};">
                <label>نسبة هبوط الجهد المسموحة (%)</label>
                <input type="number" step="any" id="vdrop_percent_custom" value="3" class="w-full">
                <div class="text-xs text-gray-500 mb-2">القيمة الموصى بها: 2% للإضاءة، 3% للقوى، 5% للمحركات</div>
            </div>
            
            <!-- حقول خاصة بوضع حساب هبوط الجهد -->
            <div id="voltage_drop_fields" style="display: ${currentMode === 'voltage_drop' ? 'block' : 'none'};">
                <label>مقطع السلك (مم²)</label>
                <input type="number" step="any" id="wire_cross_section" value="4" class="w-full">
                <div class="text-xs text-gray-500 mb-2">أدخل المقطع الفعلي المستخدم</div>
            </div>
            
            <div class="text-xs text-gray-500 mt-2"> التحذيرات والتوصيات تظهر في النتيجة</div>
        `;
        setContent(html, null);
        
        setTimeout(() => {
            const modeSelect = document.getElementById('wire_mode_select');
            if (modeSelect) modeSelect.addEventListener('change', onModeChange);
            const lengthSelect = document.getElementById('length_type_select');
            if (lengthSelect) lengthSelect.addEventListener('change', onLengthTypeChange);
            onModeChange();
            
            const calcBtn = document.getElementById('calculateBtn');
            if (calcBtn) {
                calcBtn.onclick = () => withLoading(calcBtn, performCalculation);
                calcBtn.style.display = 'flex';
            }
            
            const inputs = ['w_a', 'w_l', 'w_voltage', 'w_temp', 'install_method', 'vdrop_percent_custom', 'wire_cross_section', 'wire_phase_select', 'wire_material_select', 'wire_mode_select', 'length_type_select'];
            inputs.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.addEventListener('input', () => { if (typeof clearResult === 'function') clearResult(); });
            });
        }, 30);
    };
    
    const performCalculation = () => {
        let I_raw = parseFloat(document.getElementById('w_a')?.value);
        let L_input = parseFloat(document.getElementById('w_l')?.value);
        let voltage = parseFloat(document.getElementById('w_voltage')?.value);
        let temp = parseFloat(document.getElementById('w_temp')?.value);
        let installMethod = document.getElementById('install_method')?.value;
        
        const phaseSelect = document.getElementById('wire_phase_select');
        const materialSelect = document.getElementById('wire_material_select');
        const isThreePhase = phaseSelect?.value === 'three';
        const material = materialSelect?.value || 'cu';
        const lengthType = document.getElementById('length_type_select')?.value || 'one_way';
        
        if (isNaN(I_raw) || I_raw <= 0) { showToast('أدخل تيار صحيح (>0)', 'warning'); return; }
        if (isNaN(L_input) || L_input <= 0) { showToast('أدخل طول صحيح (>0)', 'warning'); return; }
        if (isNaN(voltage) || voltage <= 0) { showToast('أدخل جهد صحيح (>0)', 'warning'); return; }
        if (isNaN(temp) || temp < -10 || temp > 90) { showToast('درجة حرارة غير منطقية (-10 إلى 90°C)', 'warning'); return; }
        
        // حساب الطول الفعال (ذهاب + إياب) حسب نوع التيار وطريقة إدخال الطول
        let effectiveLength;
        let oneWayLength;
        
        if (lengthType === 'one_way') {
            oneWayLength = L_input;
        } else { // round_trip
            oneWayLength = L_input / 2;
        }
        
        if (isThreePhase) {
            // للثلاثة فاز: الطول الفعال = طول الذهاب (لأن العودة عبر الأطوار الأخرى)
            effectiveLength = oneWayLength;
        } else {
            // للفاز الواحد: الطول الفعال = 2 × طول الذهاب (ذهاب + عودة)
            effectiveLength = oneWayLength * 2;
        }
        
        let resistivity20 = RESISTIVITY_20[material];
        if (!resistivity20) resistivity20 = RESISTIVITY_20.cu;
        let tempFactor = 1 + 0.004 * (temp - 20);
        let resistivity = resistivity20 * tempFactor;
        
        let installFactor = INSTALLATION_FACTOR[installMethod] || 1.0;
        let requiredAmpacity = I_raw / installFactor;
        
        let isAluminum = (material === 'al');
        let ampacityTable = isAluminum ? AMPACITY_TABLE.al : AMPACITY_TABLE.cu;
        let ampacityValues = Object.keys(ampacityTable).map(Number).sort((a,b) => a-b);
        
        let minAmpacitySize = null;
        for (let size of ampacityValues) {
            if (ampacityTable[size] >= requiredAmpacity) {
                minAmpacitySize = size;
                break;
            }
        }
        if (minAmpacitySize === null) {
            showToast(' التيار كبير جداً - لا يتوفر مقطع مناسب', 'error');
            return;
        }
        
        const materialNames = {
            cu: 'نحاس', al: 'ألمنيوم', fe: 'حديد', ag: 'فضة', gold: 'ذهب', brass: 'نحاس أصفر'
        };
        
        if (currentMode === 'wire_sizing') {
            let vDropPerc = parseFloat(document.getElementById('vdrop_percent_custom')?.value);
            if (isNaN(vDropPerc) || vDropPerc <= 0) {
                showToast('أدخل نسبة هبوط جهد مسموحة صحيحة', 'warning');
                return;
            }
            
            let areaVD;
            if (isThreePhase) {
                areaVD = (Math.sqrt(3) * I_raw * effectiveLength * resistivity) / (voltage * (vDropPerc / 100));
            } else {
                areaVD = (2 * I_raw * effectiveLength * resistivity) / (voltage * (vDropPerc / 100));
            }
            
            let finalSizeByVD = getNearestStdArea(areaVD, ampacityValues);
            let finalSize = Math.max(finalSizeByVD, minAmpacitySize);
            
            let actualVD, actualVDpercent;
            if (isThreePhase) {
                actualVD = (Math.sqrt(3) * I_raw * effectiveLength * resistivity) / finalSize;
            } else {
                actualVD = (2 * I_raw * effectiveLength * resistivity) / finalSize;
            }
            actualVDpercent = (actualVD / voltage) * 100;
            
            let warnings = [];
            if (finalSize > finalSizeByVD) warnings.push(`تم زيادة المقطع إلى ${finalSize} مم² لتلبية Ampacity`);
            if (actualVDpercent > vDropPerc) warnings.push(`هبوط الجهد الفعلي (${actualVDpercent.toFixed(1)}%) > المسموح (${vDropPerc}%)`);
            if (actualVDpercent > 5) warnings.push(`هبوط الجهد كبير جداً (>5%)`);
            
            let resultObj = {
                'التيار': `${I_raw} A`,
                'طول الذهاب (المدخل)': lengthType === 'one_way' ? `${L_input} m` : `${(L_input/2).toFixed(2)} m (مستخلص من الكلي)`,
                'الطول الفعال (ذهاب+عودة)': `${effectiveLength.toFixed(2)} m`,
                'النظام': isThreePhase ? `3 فاز ${voltage}V` : `1 فاز ${voltage}V`,
                'المادة': materialNames[material] || material,
                'درجة الحرارة': `${temp}°C`,
                'طريقة التمديد': installMethod === 'air' ? 'هواء' : (installMethod === 'conduit' ? 'ماسورة' : 'مدفون'),
                'هبوط الجهد المسموح': `${vDropPerc}%`,
                'المقطع المحسوب (VD)': `${areaVD.toFixed(2)} mm² → ${finalSizeByVD} mm²`,
                'المقطع المطلوب (Ampacity)': `${minAmpacitySize} mm²`,
                'المقطع النهائي': `${finalSize} mm²`,
                'هبوط الجهد الفعلي': `${actualVD.toFixed(2)} V (${actualVDpercent.toFixed(1)}%)`
            };
            if (warnings.length) resultObj['ملاحظات'] = warnings.join(' | ');
            showFullRes('تصميم مقطع السلك', resultObj);
            
        } else {
            let crossSection = parseFloat(document.getElementById('wire_cross_section')?.value);
            if (isNaN(crossSection) || crossSection <= 0) {
                showToast('أدخل مقطع سلك صحيح (مم²)', 'warning');
                return;
            }
            
            let actualVD, actualVDpercent;
            if (isThreePhase) {
                actualVD = (Math.sqrt(3) * I_raw * effectiveLength * resistivity) / crossSection;
            } else {
                actualVD = (2 * I_raw * effectiveLength * resistivity) / crossSection;
            }
            actualVDpercent = (actualVD / voltage) * 100;
            
            let ampacityOk = true;
            let ampacityValue = null;
            if (material === 'cu' || material === 'al') {
                ampacityValue = ampacityTable[crossSection];
                if (!ampacityValue) {
                    let nearestSize = ampacityValues.find(s => s >= crossSection);
                    if (nearestSize) ampacityValue = ampacityTable[nearestSize];
                }
                if (ampacityValue && ampacityValue < requiredAmpacity) ampacityOk = false;
            }
            
            let recommendations = [];
            if (!ampacityOk && (material === 'cu' || material === 'al')) {
                recommendations.push(`⚠ المقطع ${crossSection} مم² لا يتحمل التيار (يتحمل ${ampacityValue} A فقط، المطلوب ${requiredAmpacity.toFixed(1)} A). يفضل زيادة إلى ${minAmpacitySize} مم².`);
            } else if (material !== 'cu' && material !== 'al') {
                recommendations.push(`⚠ لا توجد بيانات Ampacity لـ ${materialNames[material]}، تحقق من التيار عملياً.`);
            }
            if (actualVDpercent > 5) {
                recommendations.push(`⚠ هبوط الجهد كبير جداً (${actualVDpercent.toFixed(1)}%)`);
            } else if (actualVDpercent > 3) {
                recommendations.push(`⚠ هبوط الجهد (${actualVDpercent.toFixed(1)}%) أعلى من 3% - قد يكون مقبولاً للمحركات`);
            } else {
                recommendations.push(`✓ هبوط الجهد ضمن الحدود الموصى بها`);
            }
            
            let resultObj = {
                'التيار': `${I_raw} A`,
                'طول الذهاب (المدخل)': lengthType === 'one_way' ? `${L_input} m` : `${(L_input/2).toFixed(2)} m (مستخلص من الكلي)`,
                'الطول الفعال (ذهاب+عودة)': `${effectiveLength.toFixed(2)} m`,
                'النظام': isThreePhase ? `3 فاز ${voltage}V` : `1 فاز ${voltage}V`,
                'المادة': materialNames[material] || material,
                'مقطع السلك المدخل': `${crossSection} mm²`,
                'هبوط الجهد المحسوب': `${actualVD.toFixed(2)} V (${actualVDpercent.toFixed(1)}%)`,
                'ملاحظات': recommendations.join(' ')
            };
            showFullRes('هبوط الجهد', resultObj);
        }
    };
    
    renderWireUI();
}
    
    // أداة قوانين الكهرباء 
    else if(toolId === 'elec_laws') { 
        title.innerText = ' قوانين الكهرباء'; 
        setContent(`<div class="phase-selector"><div class="phase-option selected" onclick="ToolHelpers.setPhase(this,1)">فاز واحد (220V)</div><div class="phase-option" onclick="ToolHelpers.setPhase(this,3)">ثلاثة فاز (380V)</div></div><label>القدرة (P - واط)</label><input type="number" step="any" id="el_p"><label>الجهد (V - فولت)</label><input type="number" step="any" id="el_v" value="220"><label>التيار (I - أمبير)</label><input type="number" step="any" id="el_i"><label>المقاومة (R - أوم)</label><input type="number" step="any" id="el_r">`, () => { smartElectricCalc(); }); 
        window.ToolHelpers.setPhase = function(btn, phase) { 
            document.querySelectorAll('#modalBody .phase-option').forEach(b=>b.classList.remove('selected')); 
            btn.classList.add('selected');
            clearResult();
        };
    }
    
    // أداة حساب المكثف
    else if (toolId === 'cap_calc') { 
    title.innerText = ' حساب المكثف ';
    
    // دوال مساعدة

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
        // قراءة المدخلات العامة
        const calcMode = document.getElementById('calc_mode').value;
        const voltage = parseFloat(document.getElementById('c_v').value);
        const freq = parseFloat(document.getElementById('c_freq').value);
        const phase = document.getElementById('c_phase').value;
        const targetPf = parseFloat(document.getElementById('c_pf').value);
        
        // التحقق من المدخلات
        if (isNaN(voltage) || voltage <= 0) { showToast('أدخل جهد صحيح (>0)', 'warning'); return; }
        if (isNaN(freq) || (freq !== 50 && freq !== 60)) { showToast('اختر تردد 50 أو 60 Hz', 'warning'); return; }
        if (isNaN(targetPf) || targetPf <= 0 || targetPf > 1) { showToast('معامل قدرة بين 0 و 1', 'warning'); return; }
        
        const omega = 2 * Math.PI * freq;   // ω = 2πf
        let result = {};
        
        // تحذيرات للمستخدم
        if (voltage > 1000) showToast(' جهد عالي - تأكد من سلامة المكثف', 'warning');
        if (freq === 60 && document.getElementById('c_a')?.value > 0) {
            // تنبيه خفيف أن السعة ستكون أقل عند 60Hz
        }
        
        if (calcMode === 'cap') {
            // ---------- الوضع المباشر: حساب السعة من التيار ----------
            const current = parseFloat(document.getElementById('c_a').value);
            if (isNaN(current) || current <= 0) { showToast('أدخل تيار صحيح (>0)', 'warning'); return; }
            
            let capacitance_uf;
            let formula_used = '';
            
            if (phase === 'single') {
                // فاز واحد: I = V / Xc  →  Xc = V / I  →  C = 1 / (ω × Xc)
                let Xc = voltage / current;
                let capacitance_farad = 1 / (omega * Xc);
                capacitance_uf = capacitance_farad * 1e6;
                formula_used = 'C (µF) = (I × 10⁶) / (2πf × V)';
            } else {
                // ثلاثة فاز: I_line = V_line / (√3 × Xc)  →  Xc = V_line / (√3 × I_line)
                let Xc = voltage / (Math.sqrt(3) * current);
                let capacitance_farad = 1 / (omega * Xc);
                capacitance_uf = capacitance_farad * 1e6;
                formula_used = 'C (µF) = (I × 10⁶) / (2πf × V × √3)';
            }
            
            // حساب القدرة التفاعلية للمكثف (VAR)
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
            
            // توصيات إضافية
            if (capacitance_uf > 500) {
                result[' توصية'] = 'سعة كبيرة (>500µF) - يفضل استخدام عدة مكثفات على التوازي';
            } else if (capacitance_uf < 1) {
                result[' توصية'] = ' سعة صغيرة جداً - تحقق من قراءة التيار';
            } else {
                result[' توصية'] = ' سعة مناسبة - تأكد من جهد المكثف أن يكون أعلى من جهد التشغيل';
            }
            
        } else {
            // ---------- الوضع العكسي: حساب التيار من السعة ----------
            const capacitance_uf = parseFloat(document.getElementById('c_uf').value);
            if (isNaN(capacitance_uf) || capacitance_uf <= 0) { showToast('أدخل سعة صحيحة (>0 µF)', 'warning'); return; }
            
            let current;
            let formula_used = '';
            let capacitance_farad = capacitance_uf / 1e6;
            let Xc = 1 / (omega * capacitance_farad);
            
            if (phase === 'single') {
                // فاز واحد: I = V / Xc
                current = voltage / Xc;
                formula_used = 'I (A) = V / Xc  ,  Xc = 1/(2πfC)';
            } else {
                // ثلاثة فاز: I_line = V_line / (√3 × Xc)
                current = voltage / (Math.sqrt(3) * Xc);
                formula_used = 'I (A) = V / (√3 × Xc)  ,  Xc = 1/(2πfC)';
            }
            
            // حساب القدرة التفاعلية
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
            
            // توصيات
            if (current > 50) {
                result[' توصية'] = ' تيار عالي (>50A) - تأكد من توصيلات المكثف';
            } else if (current < 0.5) {
                result[' توصية'] = 'تيار ضعيف - السعة صغيرة أو الجهد منخفض';
            } else {
                result[' توصية'] = ' تيار مناسب';
            }
        }
        
        // إضافة تحذير التردد إذا كان المستخدم في بلد 60Hz لكنه نسي
        if (freq === 60 && calcMode === 'cap') {
            let currentVal = parseFloat(document.getElementById('c_a')?.value);
            if (currentVal && currentVal > 0) {
                let equivalent_50Hz = currentVal * (60/50);
                result[' ملاحظة'] = `لو كان التردد 50Hz، التيار سيكون ≈ ${round1(equivalent_50Hz)} A لنفس السعة`;
            }
        }
        
        showFullRes('نتائج حساب المكثف', result);
    });
    
    // إظهار/إخفاء الحقول حسب طريقة الحساب
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
}

else if (toolId === 'capacitors') {
    title.innerText = 'توصيل المكثفات';
    
    let conn = 'parallel'; // 'parallel', 'series', 'mixed'
    let num = 2;
    let seriesLen = 2;
    let branches = 2;
    
    const clearResults = clearResult;
    
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
            let eq = (order === 'seriesFirst') ? seriesCalc(vals, 'capacitor') : parallelCalc(vals, 'capacitor');
            branchEqs.push(eq);
        }
        if (branchEqs.length === 0) {
            showToast('أدخل قيم صحيحة', 'warning');
            return;
        }
        let total = (order === 'seriesFirst') ? parallelCalc(branchEqs, 'capacitor') : seriesCalc(branchEqs, 'capacitor');
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
        let res = (conn === 'parallel') ? parallelCalc(vals, 'capacitor') : seriesCalc(vals, 'capacitor');
        showFullRes('نتيجة التوصيل', {
            'نوع التوصيل': conn === 'parallel' ? 'توازي' : 'توالي',
            'القيم': vals.join(' , '),
            'السعة المكافئة': res.toFixed(5) + ' µF'
        });
    };
    
    // دالة منفصلة لتوليد الجدول المختلط مع عناوين صحيحة
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
    
    // دالة لإنشاء الواجهة بالكامل (تُستخدم عند تغيير نوع التوصيل أو لأول مرة)
    const render = () => {
        clearResults();
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
            
            // تعريف دالة لتحديث الجدول دون إعادة الرندر
            const refreshTable = () => {
                updateMixedTable();
                clearResults();
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
            
            // إنشاء الجدول الأولي
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
                        genSimpleInputs(num, 'capsInputs', 'cap_', 'µF');
                        clearResults();
                    }
                };
                numCapsInput.onblur = () => {
                    let val = numCapsInput.value.trim();
                    if (val === '') {
                        num = 1;
                        numCapsInput.value = 1;
                        genSimpleInputs(1, 'capsInputs', 'cap_', 'µF');
                        clearResults();
                    } else {
                        let newNum = parseInt(val);
                        if (isNaN(newNum) || newNum < 1) {
                            num = 1;
                            numCapsInput.value = 1;
                            genSimpleInputs(1, 'capsInputs', 'cap_', 'µF');
                            clearResults();
                        } else if (newNum > 10) {
                            num = 10;
                            numCapsInput.value = 10;
                            genSimpleInputs(10, 'capsInputs', 'cap_', 'µF');
                            clearResults();
                        }
                    }
                };
            }
            genSimpleInputs(num, 'capsInputs', 'cap_', 'µF');
            calcBtn.onclick = () => calcSimple();
            calcBtn.style.display = 'flex';
        }
        
        // أحداث أزرار نوع التوصيل
        const parBtn = document.getElementById('connPar');
        const serBtn = document.getElementById('connSer');
        const mixBtn = document.getElementById('connMix');
        if (parBtn) parBtn.onclick = () => { conn = 'parallel'; render(); };
        if (serBtn) serBtn.onclick = () => { conn = 'series'; render(); };
        if (mixBtn) mixBtn.onclick = () => { conn = 'mixed'; render(); };
    };
    
    render();
    calcBtn.style.display = 'flex';
}
//توصيل المقاومات
   else if (toolId === 'resistors') {
    title.innerText = 'توصيل المقاومات';
    
    let conn = 'parallel'; // 'parallel', 'series', 'mixed'
    let num = 2;
    let seriesLen = 2;
    let branches = 2;
    


    const clearResults = clearResult;
    
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
            let eq = (order === 'seriesFirst') ? seriesCalc(vals, 'resistor') : parallelCalc(vals, 'resistor');
            branchEqs.push(eq);
        }
        if (branchEqs.length === 0) {
            showToast('أدخل قيم صحيحة', 'warning');
            return;
        }
        let total = (order === 'seriesFirst') ? parallelCalc(branchEqs, 'resistor') : seriesCalc(branchEqs, 'resistor');
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
        let res = (conn === 'parallel') ? parallelCalc(vals, 'resistor') : seriesCalc(vals, 'resistor');
        showFullRes('نتيجة التوصيل', {
            'نوع التوصيل': conn === 'parallel' ? 'توازي' : 'توالي',
            'القيم': vals.join(' , '),
            'المقاومة المكافئة': res.toFixed(5) + ' Ω'
        });
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
        html += `</tr></thead><tbody>`;
        
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
    
    const render = () => {
        clearResults();
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
                clearResults();
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
                        genSimpleInputs(num, 'resInputs', 'res_', 'Ω');
                        clearResults();
                    }
                };
                numResInput.onblur = () => {
                    let val = numResInput.value.trim();
                    if (val === '') {
                        num = 1;
                        numResInput.value = 1;
                        genSimpleInputs(1, 'resInputs', 'res_', 'Ω');
                        clearResults();
                    } else {
                        let newNum = parseInt(val);
                        if (isNaN(newNum) || newNum < 1) {
                            num = 1;
                            numResInput.value = 1;
                            genSimpleInputs(1, 'resInputs', 'res_', 'Ω');
                            clearResults();
                        } else if (newNum > 10) {
                            num = 10;
                            numResInput.value = 10;
                            genSimpleInputs(10, 'resInputs', 'res_', 'Ω');
                            clearResults();
                        }
                    }
                };
            }
            genSimpleInputs(num, 'resInputs', 'res_', 'Ω');
            calcBtn.onclick = () => calcSimple();
            calcBtn.style.display = 'flex';
        }
        
        const parBtn = document.getElementById('connPar');
        const serBtn = document.getElementById('connSer');
        const mixBtn = document.getElementById('connMix');
        if (parBtn) parBtn.onclick = () => { conn = 'parallel'; render(); };
        if (serBtn) serBtn.onclick = () => { conn = 'series'; render(); };
        if (mixBtn) mixBtn.onclick = () => { conn = 'mixed'; render(); };
    };
    
    render();
    calcBtn.style.display = 'flex';
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
    let rho = rho20 * (1 + tempCoef * 50); // 70°C تشغيل
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
}


else if (toolId === 'motor_amp') {
        title.innerText = ' حساب تيار المحرك';
        setContent(`
           <div class="grid gap-3">
   
    <div>
        <label class="block mb-1 text-sm font-semibold">القدرة</label>
        <div class="flex gap-2">
            <input type="number" step="any" id="power_val" value="1.5" >
            <select id="power_unit" >
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
            // تعريف دالة اختيار الطور محلياً
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

            // ربط الأحداث لمسح النتيجة
            ['power_val', 'power_unit', 'ma_v', 'ma_eff', 'ma_pf'].forEach(id => {
                let el = document.getElementById(id);
                if (el) el.addEventListener('input', () => { if (typeof clearResult === 'function') clearResult(); });
            });

            let btn = document.getElementById('calculateBtn');
            if (btn) btn.onclick = () => (typeof withLoading === 'function' ? withLoading(btn, calculate) : calculate());
        });
}

    else { 
        closeModal(); 
        showToast('جاري التحديث', 'info'); 
    }
};