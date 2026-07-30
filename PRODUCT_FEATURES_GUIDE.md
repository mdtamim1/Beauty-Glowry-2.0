# 🛍️ Product Management - নতুন ফিচার গাইড

## ✨ নতুন ফিচার যুক্ত হয়েছে:

### 1️⃣ **Ingredients (উপাদান)**
- Product এর সকল উপাদান লিখুন
- **Example:** "Water, Glycerin, Aloe Vera Extract, Vitamin C, Rose Water"
- এটি Product Details page এ "Ingredients" tab এ দেখা যাবে

### 2️⃣ **How to Use (ব্যবহারের নিয়ম)**
- পণ্যটি কিভাবে ব্যবহার করতে হয় তার নির্দেশনা লিখুন
- **Example:** "Apply on clean face morning and evening. Pat gently and allow to absorb. Avoid eye area."
- এটি Product Details page এ "How to Use" tab এ দেখা যাবে

### 3️⃣ **Multiple Product Images (একাধিক ছবি)**
- Main image এর পাশাপাশি অতিরিক্ত ছবি যোগ করুন
- আলাদা আলাদা কোণ, প্যাকেজিং, ব্যবহারের ছবি যোগ করতে পারেন
- প্রতিটি ছবির URL লিখে "Add Another Image" ক্লিক করুন

---

## 📋 কীভাবে ব্যবহার করবেন?

### Step 1: Admin Dashboard তে যান
```
Go to: localhost:5175/admin
```

### Step 2: "Add New Product" ক্লিক করুন
- Products ট্যাব এ ক্লিক করুন
- "Add New Product" বাটন ক্লিক করুন

### Step 3: নতুন ফিল্ড পূরণ করুন

#### **🧪 Ingredients Field**
```
Example Input:
Rose Water, Hyaluronic Acid, Glycerin, Aloe Vera, Vitamin B5, Natural Preservatives
```

#### **📖 How to Use Field**
```
Example Input:
1. Apply 2-3 drops on clean skin
2. Gently pat until fully absorbed
3. Follow with moisturizer
4. Use twice daily - morning and night
5. Avoid direct contact with eyes
```

#### **🖼️ Multiple Product Images**
```
Default: Main product image URL

Add More Images:
- Front view: https://example.com/product-front.jpg
- Back/Package: https://example.com/product-back.jpg
- Close-up: https://example.com/product-closeup.jpg

Click "Remove" to delete any image
Click "+ Add Another Image" to add more
```

---

## 🎯 Product Details Page এ দেখা যাবে:

### **Tabs Available:**
1. **Description** - পণ্যের বিস্তারিত বর্ণনা
2. **Ingredients** - সকল উপাদানের তালিকা ⭐ **নতুন**
3. **How to Use** - ব্যবহারের নির্দেশনা ⭐ **নতুন**

### **Image Gallery:**
- Main ছবি বড় আকারে দেখা যাবে
- নিচে ছোট thumbnails থাকবে
- ক্লিক করে যেকোনো ছবি বড় করে দেখা যাবে ⭐ **নতুন**

---

## 💡 টিপস:

✅ **Ingredients** - কমা দিয়ে আলাদা করুন  
✅ **How to Use** - StepByStep পয়েন্ট ফরম্যাট ব্যবহার করুন  
✅ **Images** - সবগুলো ছবির URL একই format এ হওয়া উচিত  
✅ **Multiple Images** - 3-5 টি ছবি যথেষ্ট (বেশি slow হতে পারে)

---

## 📸 ছবির URL এর উৎস:

| Platform | Link |
|----------|------|
| **Unsplash** | https://unsplash.com/random?v=* |
| **Pexels** | https://www.pexels.com/ |
| **Pixabay** | https://pixabay.com/ |
| **Your Server** | https://yourserver.com/images/ |

---

**✨ Happy Product Managing!**
