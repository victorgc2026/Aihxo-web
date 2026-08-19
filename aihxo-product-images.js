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

    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `${productId}/${crypto.randomUUID()}.${ext}`;

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

    const existing = await getProductImages(productId);

    const result = await window.supabaseClient
      .from('product_images')
      .insert({
        product_id: productId,
        storage_path: path,
        public_url: urlData.publicUrl,
        is_primary: existing.length === 0,
        sort_order: existing.length
      });

    if (result.error) {
      alert(result.error.message);
      return;
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

  window.aihxoPhotoInput = function (productId) {
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
