(function () {
  const BUCKET = 'product-images';

  async function getProductImages(productId) {
    const { data, error } = await window.supabaseClient
      .from('product_images')
      .select('*')
      .eq('product_id', productId)
      .order('is_primary', { ascending: false })
      .order('sort_order');

    if (error) {
      console.error(error);
      return [];
    }

    return data || [];
  }

    async function uploadProductImage(productId, file) {
  if (!file || !productId) return;

  const currentProduct = (window.products || [])
    .find(p => String(p.id) === String(productId));

  if (!currentProduct) {
    alert('Producto no encontrado');
    return;
  }

  const sameVariants = (window.products || []).filter(p =>
  String(p.category || '').trim().toLowerCase() ===
    String(currentProduct.category || '').trim().toLowerCase()
  &&
  String(p.color || '').trim().toLowerCase() ===
    String(currentProduct.color || '').trim().toLowerCase()
);

  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();

  const groupKey = `${String(currentProduct.model || 'producto')
    .trim()
    .replace(/[^a-zA-Z0-9-_]/g,'-')}-${String(currentProduct.color || 'color')
    .trim()
    .replace(/[^a-zA-Z0-9-_]/g,'-')}`;

  const path = `${groupKey}/${crypto.randomUUID()}.${ext}`;

  const upload = await window.supabaseClient.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (upload.error) {
    alert(upload.error.message);
    return;
  }

  const { data: urlData } = window.supabaseClient.storage
    .from(BUCKET)
    .getPublicUrl(path);

  for (const variant of sameVariants) {
    const existing = await getProductImages(variant.id);

    const result = await window.supabaseClient
      .from('product_images')
      .insert({
        product_id: variant.id,
        storage_path: path,
        public_url: urlData.publicUrl,
        is_primary: existing.length === 0,
        sort_order: existing.length
      });

    if (result.error) {
      console.error(result.error);
    }
  }

  if (typeof window.loadAll === 'function') {
    await window.loadAll();
  }

  if (typeof window.setView === 'function') {
    window.setView('products');
  }
}

    

  window.aihxoUploadProductImage = uploadProductImage;
  window.aihxoGetProductImages = getProductImages;
window.aihxoCameraInput = function (productId) {
  const input = document.createElement('input');

  input.type = 'file';
  input.accept = 'image/*';
  input.capture = 'environment';

  input.onchange = async function () {
    const file = input.files && input.files[0];
    if (file) {
      await uploadProductImage(productId, file);
    }
  };

  input.click();
};

window.aihxoLibraryInput = function (productId) {
  const input = document.createElement('input');

  input.type = 'file';
  input.accept = 'image/*';

  input.onchange = async function () {
    const file = input.files && input.files[0];
    if (file) {
      await uploadProductImage(productId, file);
    }
  };

  input.click();
};
  
})();
