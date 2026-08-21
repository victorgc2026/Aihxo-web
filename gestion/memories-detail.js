// ===== X BY AIHXO MEMORIES · FICHA COMPLETA V1 =====
(function(){
  const $ = s => document.querySelector(s);

  const esc = s => String(s ?? '').replace(/[&<>"']/g,m=>({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    '"':'&quot;',
    "'":'&#039;'
  }[m]));

  const designStates = [
    'Nuevo',
    'Diseñando',
    'Esperando aprobación',
    'Aprobado'
  ];

  const approvalStates = [
    'Pendiente',
    'Aprobado',
    'Cambios solicitados'
  ];

  const paymentStates = [
    'Pendiente',
    'Pagado'
  ];

  const productionStates = [
    'Pendiente',
    'En producción',
    'Terminado',
    'Entregado'
  ];

  async function getMemory(id){
    const {data,error} = await window.supabaseClient
      .from('memories')
      .select('*')
      .eq('id',id)
      .single();

    if(error){
      alert('No se pudo abrir el Memory: ' + error.message);
      return null;
    }

    return data;
  }

  async function getFiles(memoryId){
    const {data,error} = await window.supabaseClient
      .from('memory_files')
      .select('*')
      .eq('memory_id',memoryId)
      .order('created_at',{ascending:false});

    if(error){
      console.error(error);
      return [];
    }

    return data || [];
  }

  function workflowStep(m){
    if(m.production_status === 'Entregado') return 6;
    if(m.production_status === 'Terminado') return 5;
    if(m.production_status === 'En producción') return 4;
    if(m.payment_status === 'Pagado') return 3;

    if(
      m.approval_status === 'Aprobado' ||
      m.design_status === 'Aprobado'
    ) return 2;

    if(
      m.design_status === 'Diseñando' ||
      m.design_status === 'Esperando aprobación'
    ) return 1;

    return 0;
  }

  function workflowHtml(m){
    const current = workflowStep(m);

    const steps = [
      'Nuevo',
      'Diseño',
      'Aprobación',
      'Pago',
      'Producción',
      'Terminado',
      'Entregado'
    ];

    return `
      <div class="mem-detail-steps">
        ${steps.map((s,i)=>`
          <div class="${i <= current ? 'done' : ''}">
            <span>${i+1}</span>
            <small>${s}</small>
          </div>
        `).join('')}
      </div>
    `;
  }

  function fileIcon(type){
    if(type === 'original') return '🖼️';
    if(type === 'firma') return '✍️';
    if(type === 'mockup') return '👕';
    if(type === 'dtf') return '🖨️';
    return '📎';
  }

  async function signedUrl(path){
    const {data,error} = await window.supabaseClient
      .storage
      .from('memory-files')
      .createSignedUrl(path,300);

    if(error){
      alert(error.message);
      return null;
    }

    return data.signedUrl;
  }

  async function openStoredFile(path){
    const url = await signedUrl(path);

    if(url){
      window.open(url,'_blank');
    }
  }

  async function renderFileList(memoryId){
    const el = $('#memoryFilesList');

    if(!el) return;

    el.innerHTML = '<div class="empty">Cargando archivos…</div>';

    const files = await getFiles(memoryId);

    if(!files.length){
      el.innerHTML = `
        <div class="mem-files-empty">
          Todavía no hay archivos asociados a este Memory.
        </div>
      `;
      return;
    }

    el.innerHTML = files.map(f=>`
      <div class="mem-file-row">

        <div class="mem-file-icon">
          ${fileIcon(f.file_type)}
        </div>

        <div class="mem-file-info">
          <b>${esc(f.file_name)}</b>

          <small>
            ${esc(f.file_type)}
            ${f.notes ? ' · '+esc(f.notes) : ''}
          </small>
        </div>

        <button
          type="button"
          class="secondary"
          onclick="window.openMemoryFileAIHXO('${esc(f.storage_path)}')">
          Abrir
        </button>

      </div>
    `).join('');
  }
    async function uploadFile(memoryId){
    const input = $('#memoryFileInput');
    const type = $('#memoryFileType')?.value || 'original';
    const notes = $('#memoryFileNotes')?.value || '';
    const file = input?.files?.[0];

    if(!file){
      alert('Selecciona un archivo.');
      return;
    }

    if(file.size > 20 * 1024 * 1024){
      alert('El archivo supera el límite de 20 MB.');
      return;
    }

    const safe = file.name.replace(/[^a-zA-Z0-9._-]+/g,'-');
    const path = `${memoryId}/${Date.now()}-${safe}`;

    const btn = $('#uploadMemoryFileBtn');

    if(btn){
      btn.disabled = true;
      btn.textContent = 'Subiendo…';
    }

    const up = await window.supabaseClient
      .storage
      .from('memory-files')
      .upload(path,file,{
        cacheControl:'3600',
        upsert:false,
        contentType:file.type || undefined
      });

    if(up.error){
      if(btn){
        btn.disabled = false;
        btn.textContent = 'Subir archivo';
      }

      alert('No se pudo subir: ' + up.error.message);
      return;
    }

    const row = await window.supabaseClient
      .from('memory_files')
      .insert({
        memory_id:memoryId,
        file_type:type,
        file_name:file.name,
        storage_path:path,
        mime_type:file.type || null,
        file_size:file.size,
        notes:notes
      });

    if(row.error){
      await window.supabaseClient
        .storage
        .from('memory-files')
        .remove([path]);

      if(btn){
        btn.disabled = false;
        btn.textContent = 'Subir archivo';
      }

      alert('No se pudo registrar el archivo: ' + row.error.message);
      return;
    }

    input.value = '';

    if($('#memoryFileNotes')){
      $('#memoryFileNotes').value = '';
    }

    if(btn){
      btn.disabled = false;
      btn.textContent = 'Subir archivo';
    }

    await renderFileList(memoryId);
  }


  async function saveDetail(e,id){
    e.preventDefault();

    const f = new FormData(e.target);

    const old = await getMemory(id);

    if(!old) return;

    const now = new Date().toISOString();

    const approval = f.get('approval_status');
    const payment = f.get('payment_status');
    const production = f.get('production_status');

    const obj = {
      customer_name:f.get('customer_name'),
      contact:f.get('contact'),
      memory_type:f.get('memory_type'),
      title:f.get('title'),
      description:f.get('description'),

      product:f.get('product'),
      size:f.get('size'),
      color:f.get('color'),
      price:Number(f.get('price') || 0),

      material_received:f.get('material_received'),
      design_notes:f.get('design_notes'),

      design_status:f.get('design_status'),
      approval_status:approval,
      payment_status:payment,
      production_status:production,

      notes:f.get('notes'),

      updated_at:now,

      approved_at:
        approval === 'Aprobado'
          ? (old.approved_at || now)
          : null,

      paid_at:
        payment === 'Pagado'
          ? (old.paid_at || now)
          : null,

      completed_at:
        ['Terminado','Entregado'].includes(production)
          ? (old.completed_at || now)
          : null
    };

    const {error} = await window.supabaseClient
      .from('memories')
      .update(obj)
      .eq('id',id);

    if(error){
      alert('No se pudo guardar: ' + error.message);
      return;
    }

    alert('Memory actualizado');

    await openDetail(id);
  }
    async function openDetail(id){
    const m = await getMemory(id);

    if(!m) return;

    const drawer = $('#drawer');
    const body = $('#drawerBody');

    if(!drawer || !body) return;

    drawer.classList.remove('hidden');

    body.innerHTML = `
      <div class="mem-detail">

        <div class="mem-detail-top">

          <div>
            <div class="mem-kicker">
              X BY AIHXO MEMORIES
            </div>

            <h2>
              ${esc(m.memory_number)}
            </h2>

            <div class="muted">
              ${esc(m.title || 'Proyecto sin título')}
            </div>
          </div>

          <div class="mem-price-big">
            ${Number(m.price || 0).toLocaleString(
              'es-ES',
              {
                style:'currency',
                currency:'EUR'
              }
            )}
          </div>

        </div>


        ${workflowHtml(m)}


        <form
          id="memoryDetailForm"
          class="form"
        >


          <section class="mem-section">

            <h3>
              Cliente y recuerdo
            </h3>

            <div class="formgrid">

              <div class="field">
                <label>Cliente</label>

                <input
                  name="customer_name"
                  required
                  value="${esc(m.customer_name || '')}"
                >
              </div>

              <div class="field">
                <label>Contacto</label>

                <input
                  name="contact"
                  value="${esc(m.contact || '')}"
                >
              </div>

            </div>


            <div class="formgrid">

              <div class="field">
                <label>Tipo</label>

                <input
                  name="memory_type"
                  value="${esc(m.memory_type || '')}"
                >
              </div>

              <div class="field">
                <label>Título</label>

                <input
                  name="title"
                  value="${esc(m.title || '')}"
                >
              </div>

            </div>


            <div class="field">

              <label>
                Historia / descripción
              </label>

              <textarea
                name="description"
                rows="4"
              >${esc(m.description || '')}</textarea>

            </div>

          </section>


          <section class="mem-section">

            <h3>
              Producto
            </h3>

            <div class="formgrid">

              <div class="field">

                <label>
                  Producto
                </label>

                <input
                  name="product"
                  value="${esc(m.product || '')}"
                >

              </div>


              <div class="field">

                <label>
                  Precio
                </label>

                <input
                  name="price"
                  type="number"
                  step=".01"
                  min="0"
                  value="${Number(m.price || 0)}"
                >

              </div>

            </div>


            <div class="formgrid">

              <div class="field">

                <label>
                  Talla
                </label>

                <input
                  name="size"
                  value="${esc(m.size || '')}"
                >

              </div>


              <div class="field">

                <label>
                  Color
                </label>

                <input
                  name="color"
                  value="${esc(m.color || '')}"
                >

              </div>

            </div>

          </section>


          <section class="mem-section">

            <h3>
              Material recibido
            </h3>

            <div class="field">

              <label>
                Resumen del material
              </label>

              <textarea
                name="material_received"
                rows="4"
                placeholder="Ej. 3 fotos, una firma y una fecha…"
              >${esc(m.material_received || '')}</textarea>

            </div>


            <div class="mem-upload-box">

              <div class="formgrid">

                <div class="field">

                  <label>
                    Tipo de archivo
                  </label>

                  <select id="memoryFileType">

                    <option value="original">
                      Foto / original
                    </option>

                    <option value="firma">
                      Firma / dibujo
                    </option>

                    <option value="mockup">
                      Mockup para aprobar
                    </option>

                    <option value="dtf">
                      Archivo final DTF
                    </option>

                    <option value="otro">
                      Otro
                    </option>

                  </select>

                </div>


                <div class="field">

                  <label>
                    Nota
                  </label>

                  <input
                    id="memoryFileNotes"
                    placeholder="Opcional"
                  >

                </div>

              </div>


              <div class="field">

                <label>
                  Archivo
                </label>

                <input
                  id="memoryFileInput"
                  type="file"
                >

              </div>


              <button
                type="button"
                class="secondary"
                id="uploadMemoryFileBtn"
              >
                📎 Subir archivo
              </button>

            </div>


            <div
              id="memoryFilesList"
              class="mem-files-list"
            ></div>

          </section>


          <section class="mem-section">

            <h3>
              Diseño y aprobación
            </h3>


            <div class="field">

              <label>
                Notas de diseño
              </label>

              <textarea
                name="design_notes"
                rows="4"
              >${esc(m.design_notes || '')}</textarea>

            </div>


            <div class="formgrid">

              <div class="field">

                <label>
                  Estado diseño
                </label>

                <select name="design_status">

                  ${designStates.map(x=>`
                    <option
                      ${m.design_status === x ? 'selected' : ''}
                    >
                      ${x}
                    </option>
                  `).join('')}

                </select>

              </div>


              <div class="field">

                <label>
                  Aprobación cliente
                </label>

                <select name="approval_status">

                  ${approvalStates.map(x=>`
                    <option
                      ${m.approval_status === x ? 'selected' : ''}
                    >
                      ${x}
                    </option>
                  `).join('')}

                </select>

              </div>

            </div>

          </section>


          <section class="mem-section">

            <h3>
              Pago y producción
            </h3>


            <div class="formgrid">

              <div class="field">

                <label>
                  Pago
                </label>

                <select name="payment_status">

                  ${paymentStates.map(x=>`
                    <option
                      ${m.payment_status === x ? 'selected' : ''}
                    >
                      ${x}
                    </option>
                  `).join('')}

                </select>

              </div>


              <div class="field">

                <label>
                  Producción
                </label>

                <select name="production_status">

                  ${productionStates.map(x=>`
                    <option
                      ${m.production_status === x ? 'selected' : ''}
                    >
                      ${x}
                    </option>
                  `).join('')}

                </select>

              </div>

            </div>

          </section>


          <section class="mem-section">

            <h3>
              Notas internas
            </h3>

            <div class="field">

              <textarea
                name="notes"
                rows="4"
              >${esc(m.notes || '')}</textarea>

            </div>

          </section>


          <button
            class="primary mem-save"
            type="submit"
          >
            Guardar ficha Memory
          </button>


        </form>

      </div>
    `;


    $('#memoryDetailForm').onsubmit = e =>
      saveDetail(e,id);


    $('#uploadMemoryFileBtn').onclick = () =>
      uploadFile(id);


    renderFileList(id);
  }
    function injectStyles(){
    if($('#memoriesDetailStyles')) return;

    const s = document.createElement('style');

    s.id = 'memoriesDetailStyles';

    s.textContent = `
      .mem-detail{
        padding-bottom:20px;
      }

      .mem-detail-top{
        display:flex;
        justify-content:space-between;
        gap:16px;
        align-items:flex-start;
        margin-bottom:18px;
      }

      .mem-detail-top h2{
        font-size:30px;
        margin:4px 0;
      }

      .mem-kicker{
        font-size:9px;
        letter-spacing:2px;
        font-weight:900;
        color:#087cf4;
      }

      .mem-price-big{
        font-size:20px;
        font-weight:900;
      }

      .mem-detail-steps{
        display:grid;
        grid-template-columns:repeat(7,1fr);
        gap:5px;
        margin:18px 0 26px;
      }

      .mem-detail-steps div{
        text-align:center;
        color:#98a2b3;
      }

      .mem-detail-steps span{
        display:flex;
        width:26px;
        height:26px;
        border-radius:50%;
        background:#eef2f6;
        align-items:center;
        justify-content:center;
        margin:auto;
        font-size:10px;
        font-weight:900;
      }

      .mem-detail-steps small{
        display:block;
        font-size:8px;
        margin-top:5px;
      }

      .mem-detail-steps .done{
        color:#087cf4;
      }

      .mem-detail-steps .done span{
        background:#087cf4;
        color:#fff;
      }

      .mem-section{
        border-top:1px solid #e7ebf1;
        padding-top:20px;
        margin-top:20px;
      }

      .mem-section h3{
        font-size:18px;
        margin:0 0 14px;
      }

      .mem-upload-box{
        background:#f6f8fb;
        border:1px dashed #cfd7e5;
        border-radius:16px;
        padding:15px;
        margin-top:12px;
      }

      .mem-files-list{
        margin-top:14px;
      }

      .mem-files-empty{
        padding:18px;
        text-align:center;
        color:#7b879f;
        background:#fafbfc;
        border-radius:12px;
      }

      .mem-file-row{
        display:flex;
        align-items:center;
        gap:10px;
        padding:11px 0;
        border-bottom:1px solid #edf0f5;
      }

      .mem-file-icon{
        font-size:22px;
      }

      .mem-file-info{
        flex:1;
        min-width:0;
      }

      .mem-file-info b,
      .mem-file-info small{
        display:block;
        overflow-wrap:anywhere;
      }

      .mem-file-info small{
        color:#7b879f;
        margin-top:3px;
      }

      .mem-save{
        width:100%;
        margin-top:24px;
      }

      @media(max-width:600px){

        .mem-detail-steps{
          grid-template-columns:repeat(4,1fr);
          row-gap:12px;
        }

        .mem-detail-top{
          flex-direction:column;
        }

      }
    `;

    document.head.appendChild(s);
  }


  injectStyles();


  window.openMemoryFileAIHXO =
    openStoredFile;


  window.openMemoryDetailAIHXO =
    openDetail;


  const wait = setInterval(()=>{

    if(window.editMemoryAIHXO){

      window.editMemoryAIHXO =
        id => openDetail(id);

      clearInterval(wait);
    }

  },300);


  setInterval(()=>{

    if(
      window.editMemoryAIHXO &&
      window.editMemoryAIHXO !== openDetail
    ){

      window.editMemoryAIHXO =
        id => openDetail(id);

    }

  },1500);

})();
