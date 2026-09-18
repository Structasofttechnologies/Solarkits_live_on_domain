**Haan, agar aap abhi order karenge toh Delivery Management module aur yeh dono tabs (`7. Delivery Queue` aur `8. Trip Tracking & POD`) bilkul sahi se work karenge!**

Poora system end-to-end connected hai. Chaliye main aapko step-by-step explain karta hoon ki yeh dono tabs kaise kaam karte hain aur aapka order yahan kaise flow hoga:

---

### 1. Order Place karne ke baad kya hota hai? (Prerequisite)

Jab aap **Solar Store** (`solar-store`) ya **Reseller Portal** se order place karte hain:
1. Agar order **Offline Bank Transfer (NEFT/RTGS/UPI + Receipt Upload)** se place hua hai, toh pehle order ka status `pending_verification` hota hai.
2. Jaise hi Admin Portal mein Accounts/Admin us receipt ko **Approve** kar deta hai (ya order ka `payment_status` = `captured` / `approved` / `PAID` ho jaata hai):
   - Order ka status `confirmed` ho jaata hai.
   - **Immediately yeh order Tab 7: "Delivery Queue" mein show hone lagta hai.**

---

### 2. Tab 7: "Delivery Queue" kaise kaam karta hai?

Is tab ka kaam hai **dispatch ke liye ready paid orders ko manage aur consolidate karna**:

* **FIFO Rule (First-In, First-Out):**
  - Jis order ka payment sabse pehle aaya tha, wo list mein sabse upar dikhega taaki dispatch delay na ho.
* **Live Order Details:**
  - **Order Number & Type:** (EPC Order ya Franchisee PO)
  - **Customer Info:** Name, Phone Number, Destination District, State aur Pincode.
  - **Weight & Cargo Metrics:** ComboKit Weight Master ke hisaab se calculate kiya gaya Total Weight (KG), Total Kits, aur kW load.
  - **SLA Waiting Time:** Order queue mein kitne ghante se wait kar raha hai (36h/48h par alert indicator dikhta hai).
* **Automatic Route Clubbing (Combine Delivery Suggestion):**
  - Agar ek hi route ya paas ke districts ke 2 ya zyada orders hain, toh upar **"Combine Delivery Available"** ka suggestion card show hoga. Wahan se aap multiple orders ko ek hi truck mein club karke delivery cost bacha sakte hain.
* **Actions:**
  - Har order ke aage **"Create Delivery"** ka button hota hai (aur priority change karne ka audit button).

---

### 3. Trip Create karna (Create Delivery Modal)

Jab aap Tab 7 mein **"Create Delivery"** (ya "Combine Orders") par click karenge:
1. Ek modal open hoga jo automatically check karega:
   - Is cargo load (KG) aur distance ke liye kaun-si gaadiyan fit hain (`Eligible Fleet`).
   - Transport Vendor aur Driver details (Name, Contact, License).
   - Benchmark rate comparison (cost benchmark se zyada toh nahi hai).
2. Vendor transport cost aur pickup/delivery dates set karke jaise hi aap **Submit** karenge:
   - Ek Master Trip generate hogi (jaise `DEL-2026-0001`).
   - Allotted vehicle lock hokar `Assigned` status mein chala jaayega.
   - Yeh order **Tab 7 (Queue) se nikal kar Tab 8 (Trip Tracking & POD) mein transfer ho jaayega.**

---

### 4. Tab 8: "Trip Tracking & POD" kaise kaam karta hai?

Is tab ka kaam hai **live transport trip ko track karna aur delivery confirm karna**:

* **10-Step Journey Milestones:**
  Trip step-by-step progress karti hai:
  $$\text{Created} \rightarrow \text{Vehicle Assigned} \rightarrow \text{Loading} \rightarrow \text{Dispatched} \rightarrow \text{In Transit} \rightarrow \text{At Destination} \rightarrow \text{Delivered} \rightarrow \text{POD Confirmed} \rightarrow \text{Closed}$$
* **Status Updates:**
  - Admin/Logistics manager stage button se status advance kar sakte hain (jaise truck warehouse se nikla toh `Dispatched` $\rightarrow$ `In Transit`).
* **Proof of Delivery (POD) Confirmation:**
  - Jab gaadi customer ke address par deliver karti hai, toh har stop ke liye **"Confirm POD"** ka option hota hai.
  - Wahan delivery proof (photo/document URL), receiver ka naam aur mobile number submit kiya jaata hai.
  - POD confirm hote hi:
    - Customer ka underlying order **`delivered`** mark ho jaata hai.
    - Agar combined trip hai, toh baaki stops deliver hone tak trip active rehti hai.
    - Saare stops confirm hone par trip **`pod_confirmed`** ho jaati hai aur assigned vehicle dobara **`Available`** state mein free ho jaata hai.

---

### Summary Table

| Tab | Role / Purpose | Input | Output / Result |
| :--- | :--- | :--- | :--- |
| **7. Delivery Queue** | Paid orders ki queue aur route clubbing | Customer dwara paid/confirmed orders | Fleet selection aur Delivery Trip create karna |
| **8. Trip Tracking & POD** | Vehicle transit tracking aur delivery confirmation | Created Delivery Trip (`DEL-xxxx`) | Step-by-step status update, POD upload aur Order complete delivery |

> **Testing Tip:** Agar aap abhi store se order test karna chahte hain, toh order place karne ke baad Admin portal mein jaakar payment verify/approve kar dijiye; wo turant **Delivery Queue** mein reflect ho jaayega!
