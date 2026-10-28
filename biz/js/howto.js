import { modal } from './ui.js';

export function openHowto() {
  modal({
    title: 'Cách chơi',
    sub: 'Một ngày của bạn có hai phần: chuẩn bị và phục vụ.',
    body: `
      <div class="how-list">
        <div class="how-item"><b>1. Chuẩn bị</b><p>Nấu nước dùng, nhập topping, xem nhiệm vụ và thời tiết. Mưa lạnh thì khách đông, nắng nóng thì vắng hơn.</p></div>
        <div class="how-item"><b>2. Phục vụ</b><p>Khách gọi mì kèm cấp cay và topping. Thả mì vào nồi, chờ chín rồi vớt ra rổ. Lấy tô, chọn nước dùng, chỉnh cấp cay, thêm topping, bấm Giao món.</p></div>
        <div class="how-item"><b>3. Đúng ý khách</b><p>Nước dùng đúng loại, cấp cay lệch một cấp bị trừ điểm, thiếu topping cũng vậy. Khách chờ lâu sẽ bỏ đi.</p></div>
        <div class="how-item"><b>4. Lên cấp</b><p>Bán càng nhiều, điểm càng cao, cấp tiệm càng tăng. Cấp mới mở nước dùng, topping và nâng cấp mới.</p></div>
        <div class="how-item"><b>5. Tiền lời</b><p>Quán có két riêng. Cuối mỗi ngày, lãi (hoặc lỗ) được chuyển thẳng vào ví Teechat.</p></div>
      </div>`,
    actions: [{ label: 'Hiểu rồi', kind: 'primary' }],
  });
}
