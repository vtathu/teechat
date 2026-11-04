// ===================== CHỦ ĐỀ HOẠT ĐỘNG =====================
// Mỗi chủ đề là một hoạt động 3 bước, có thưởng riêng và được ghi vào ký ức truyện.
// Không dùng "Gọi thoại" vì ứng dụng không có giọng nói thật.
const CHAT_THEMES = {
  daily: {
    id: 'daily', icon: '🏡', name: 'Đời thường', tagline: 'Chợ, bếp, một buổi ở nhà',
    minLv: 1, open: true,
    rewards: { money: [15000, 35000, 60000], box: ['normal', 'normal', 'normal'], aff: [0, 1, 2] },
    closing: [
      'Cuối buổi, không khí hơi nặng nề, cả hai đều có điều chưa kịp nói.',
      'Buổi này khép lại nhẹ nhàng, để lại một cảm giác dễ chịu.',
      'Kết thúc thật đẹp, cả hai đều nhớ rất rõ từng chi tiết nhỏ.'
    ],
    steps: [
      {
        text: (c, me) => `Sáng cuối tuần, ${c} đứng ở cửa bếp với túi đồ vừa mua. ${c} nhìn ${me} rồi hỏi: "Hôm nay mình ăn gì đây?"`,
        options: [
          { label: 'Cùng nấu món cả hai thích', tone: 'good', line: (c, me) => `${c} và ${me} cùng chen trong bếp, tiếng cười làm căn nhà ấm hẳn lên.` },
          { label: 'Gọi đồ ăn ngoài cho nhanh', tone: 'mid', line: (c, me) => `${c} và ${me} ăn xong nhanh chóng, nhưng căn bếp vẫn lạnh và im.` },
          { label: 'Để mình làm hết, bạn nghỉ đi', tone: 'bad', line: (c, me) => `${c} ngồi ngoài, tay bấm điện thoại, thỉnh thoảng nhìn vào bếp rồi thôi.` }
        ]
      },
      {
        text: (c, me) => `Giữa chợ đông, ${c} dừng trước quầy cá và quay sang: "Chọn giúp mình đi, ${me}."`,
        options: [
          { label: 'Hỏi c thích món nào rồi chọn', tone: 'good', line: (c, me) => `${c} reo lên khi ${me} nhớ đúng món ${c} thích, cả hai xách đồ về thật vui.` },
          { label: 'Mua đúng danh sách đã ghi', tone: 'mid', line: (c, me) => `${c} gật đầu, ghi thêm vài món rồi lặng lẽ theo ${me} ra khỏi chợ.` },
          { label: 'Tự chọn thứ mình muốn', tone: 'bad', line: (c, me) => `${c} nhìn túi đồ trong tay ${me}, khẽ nói: "Vậy cũng được."` }
        ]
      },
      {
        text: (c, me) => `Cơm xong, trời đổ mưa. ${c} tựa cửa sổ, chén trà còn ấm, căn phòng chỉ còn tiếng mưa.`,
        options: [
          { label: 'Ngồi xuống nghe c kể chuyện', tone: 'good', line: (c, me) => `${c} kể ${me} nghe chuyện cũ, giọng chậm dần rồi cả hai cùng im lặng thật thoải mái.` },
          { label: 'Dọn dẹp rồi ai về phòng nấy', tone: 'mid', line: (c, me) => `${c} dọn chén, ${me} lau bàn, câu chuyện dang dở bỏ ngang giữa chừng.` },
          { label: 'Vừa ăn vừa xem điện thoại', tone: 'bad', line: (c, me) => `${c} nhìn ${me} chăm chú vào màn hình, rồi đứng dậy mang chén của mình đi trước.` }
        ]
      }
    ]
  },

  work: {
    id: 'work', icon: '💼', name: 'Ca làm chung', tagline: 'Cùng một ca, cùng một ca trực',
    minLv: 1, open: true,
    rewards: { money: [30000, 70000, 120000], box: ['normal', 'normal', 'silver'], aff: [0, 1, 2] },
    closing: [
      'Ca làm kết thúc trong mệt mỏi, vài điều đã bị bỏ lỡ.',
      'Ca làm trôi qua ổn, cả hai phối hợp được với nhau.',
      'Ca làm thành công hơn mong đợi, cả hai đều được nhắc tới.'
    ],
    steps: [
      {
        text: (c, me) => `Quản lý giao một đống việc trước giờ cao điểm. ${c} lau mồ hôi, quay sang: "Làm chung hay chia ra?"`,
        options: [
          { label: 'Làm chung, phụ c khi cần', tone: 'good', line: (c, me) => `${c} và ${me} chia nhau từng việc, phối hợp ăn ý đến mức quản lý phải gật đầu.` },
          { label: 'Chia việc cho nhanh', tone: 'mid', line: (c, me) => `${c} và ${me} mỗi người một góc, xong việc nhưng không ai nói với ai câu nào.` },
          { label: 'Để c tự làm phần khó', tone: 'bad', line: (c, me) => `${c} ôm phần khó một mình, đến giữa ca thì thở dài thật nặng.` }
        ]
      },
      {
        text: (c, me) => `Một khách hàng nổi nóng vì đơn bị chậm. ${c} đứng chắn trước quầy, ánh mắt cầu cứu nhìn ${me}.`,
        options: [
          { label: 'Bình tĩnh xử lý cùng c', tone: 'good', line: (c, me) => `${c} và ${me} một người xin lỗi, một người sửa đơn, khách dịu xuống rồi bỏ đi.` },
          { label: 'Gọi quản lý tới giải quyết', tone: 'mid', line: (c, me) => `${c} lùi lại nhường lời, nhưng ánh mắt vẫn còn lấn cấn sau khi mọi chuyện xong.` },
          { label: 'Nói trước mặt mọi người là do c', tone: 'bad', line: (c, me) => `${c} đứng im, mặt đỏ lên, cả ca làm sau đó không nói với ${me} một câu.` }
        ]
      },
      {
        text: (c, me) => `Hết ca, đèn trong quán tắt dần. ${c} ngồi ở bậc thềm, tay xoa vai mỏi.`,
        options: [
          { label: 'Mời c ly nước, cảm ơn thật lòng', tone: 'good', line: (c, me) => `${c} nhận ly nước, cười mệt nhưng thật, rồi hai người ngồi thêm một lúc mới về.` },
          { label: 'Chào một câu rồi về', tone: 'mid', line: (c, me) => `${c} giơ tay chào ${me}, đợi bóng ${me} khuất rồi mới đứng dậy.` },
          { label: 'Nhận hết công về mình', tone: 'bad', line: (c, me) => `${c} nghe ${me} kể công, không đáp, chỉ cúi xuống buộc lại dây giày.` }
        ]
      }
    ]
  },

  mystery: {
    id: 'mystery', icon: '🔍', name: 'Điều tra', tagline: 'Một vụ việc lạ cần làm rõ',
    minLv: 2, open: true,
    rewards: { money: [20000, 50000, 90000], box: ['normal', 'normal', 'silver'], aff: [0, 1, 2] },
    closing: [
      'Vụ việc khép lại với nhiều câu hỏi hơn là câu trả lời.',
      'Hai người ghép được vài mảnh, nhưng vẫn còn một chỗ trống.',
      'Sự thật hiện ra gọn gàng, và cả hai đều nhớ rõ ai đã tin ai.'
    ],
    steps: [
      {
        text: (c, me) => `Một phong thư không tên kẹp trước cửa. ${c} bóc ra, bên trong chỉ có một địa chỉ cũ và vết mực nhòe. ${c} nhìn ${me}: "Đi không?"`,
        options: [
          { label: 'Cùng xem kỹ bức thư trước', tone: 'good', line: (c, me) => `${c} và ${me} soi từng nét chữ, phát hiện một chi tiết nhỏ mà cả hai suýt bỏ qua.` },
          { label: 'Báo cho người quen biết chuyện', tone: 'mid', line: (c, me) => `${c} gọi điện hỏi han, nhận lại vài lời khuyên mơ hồ rồi gấp lá thư lại.` },
          { label: 'Coi đó là trò đùa rồi bỏ qua', tone: 'bad', line: (c, me) => `${c} đặt lá thư xuống bàn, nhưng đêm đó ${c} vẫn một mình quay lại nhìn nó.` }
        ]
      },
      {
        text: (c, me) => `Địa chỉ dẫn tới một căn nhà bỏ trống. ${c} chỉ tay vào dấu chân trên bụi: "Có người vừa tới đây."`,
        options: [
          { label: 'Tin vào linh cảm của c', tone: 'good', line: (c, me) => `${c} và ${me} theo dấu chân, tìm ra một ngăn kéo bị giấu sau tủ.` },
          { label: 'Hoài nghi, bảo c đoán bừa', tone: 'mid', line: (c, me) => `${c} im lặng thu lại ánh mắt, từ đó chỉ đi theo sau ${me} mà không nói thêm.` },
          { label: 'Giấu manh mối tự mình điều tra', tone: 'bad', line: (c, me) => `${c} phát hiện ${me} giấu điều gì đó, ánh nhìn đổi hẳn sang cảnh giác.` }
        ]
      },
      {
        text: (c, me) => `Người trong lá thư xuất hiện ở cuối con hẻm. ${c} siết nhẹ tay áo ${me}, giọng rất thấp: "Để mình nói trước."`,
        options: [
          { label: 'Để c dẫn, đứng sau hỗ trợ', tone: 'good', line: (c, me) => `${c} nói chuyện dứt khoát, ${me} đứng ngay sau, và sự thật cuối cùng được nói ra.` },
          { label: 'Giành nói thay c', tone: 'mid', line: (c, me) => `${c} lùi lại nhường lời, nhưng câu chuyện vì thế mà lệch mất một đoạn.` },
          { label: 'Quay sang chất vấn c', tone: 'bad', line: (c, me) => `${c} sững người, còn người kia nhân lúc đó biến mất khỏi con hẻm.` }
        ]
      }
    ]
  },

  adventure: {
    id: 'adventure', icon: '🗺️', name: 'Phiêu lưu', tagline: 'Một chuyến đi không hẹn trước',
    minLv: 3, open: false,
    rewards: { money: [25000, 60000, 110000], box: ['normal', 'normal', 'silver'], aff: [1, 2, 3] },
    closing: [
      'Chuyến đi kết thúc trong rã rời, và cả hai đều biết mình đã sai ở đâu.',
      'Chuyến đi không như dự tính, nhưng vẫn có thứ đáng nhớ.',
      'Chuyến đi trở thành một câu chuyện cả hai sẽ kể lại nhiều lần.'
    ],
    steps: [
      {
        text: (c, me) => `${c} kéo ${me} lên chuyến xe cuối ngày, không nói trước điểm đến. Đến ngã ba, ${c} đưa bản đồ ra: "Đường này hay đường kia?"`,
        options: [
          { label: 'Cùng xem bản đồ rồi chọn', tone: 'good', line: (c, me) => `${c} và ${me} cúi sát bản đồ, cùng chọn một con đường và cùng bước lên.` },
          { label: 'Tranh cãi một lúc rồi đi liều', tone: 'mid', line: (c, me) => `${c} và ${me} chọn đại một hướng, ai cũng còn giữ ý riêng.` },
          { label: 'Tách ra, ai đi đường nấy', tone: 'bad', line: (c, me) => `${c} và ${me} mỗi người một hướng, càng đi khoảng cách càng xa.` }
        ]
      },
      {
        text: (c, me) => `Trời đổ mưa, cây cầu gỗ trước mặt lung lay. ${c} bước thử một nhịp, quay lại nhìn ${me}.`,
        options: [
          { label: 'Nắm tay c cùng qua cầu', tone: 'good', line: (c, me) => `${c} nắm chặt tay ${me}, hai người qua cầu an toàn dù tim vẫn còn đập mạnh.` },
          { label: 'Đứng chờ người tới giúp', tone: 'mid', line: (c, me) => `${c} và ${me} đứng nép dưới mưa, chờ rất lâu mới có người đi ngang.` },
          { label: 'Bỏ c lại, tự đi trước', tone: 'bad', line: (c, me) => `${c} nhìn theo ${me} qua cầu, không gọi, chỉ lặng lẽ ôm túi đồ đứng dưới mưa.` }
        ]
      },
      {
        text: (c, me) => `Đêm xuống, hai người trú trong một chòi nhỏ. ${c} run nhẹ, đưa tay hơ trước ngọn lửa vừa nhóm.`,
        options: [
          { label: 'Chia áo, ngồi sát sưởi ấm', tone: 'good', line: (c, me) => `${c} khoác chung áo với ${me}, hơi ấm làm cơn run dịu dần, và câu chuyện kéo dài tới khuya.` },
          { label: 'Giữ khoảng cách, ai ngủ nấy', tone: 'mid', line: (c, me) => `${c} và ${me} mỗi người một góc, ngọn lửa nhỏ dần cho tới sáng.` },
          { label: 'Trách c vì chuyến đi này', tone: 'bad', line: (c, me) => `${c} không đáp, chỉ quay mặt vào vách, bờ vai khẽ run.` }
        ]
      }
    ]
  },

  night: {
    id: 'night', icon: '🌙', name: 'Tâm sự đêm khuya', tagline: 'Một đêm nói thật lòng',
    minLv: 12, open: false,
    rewards: { money: [0, 0, 0], box: [null, null, null], aff: [3, 5, 8] },
    closing: [
      'Đêm đó kết thúc trong im lặng, có điều gì đó vừa rạn ra.',
      'Đêm đó nhẹ hơn mọi đêm trước, như có người cùng giữ nỗi lòng.',
      'Đêm đó trở thành một ký ức rất riêng, cả hai đều không quên.'
    ],
    steps: [
      {
        text: (c, me) => `Đêm khuya, ${c} tìm thấy ${me} ngồi một mình ở lan can. ${c} đứng bên cạnh một lúc lâu mới lên tiếng: "Chưa ngủ được à?"`,
        options: [
          { label: 'Ngồi xuống, im lặng cùng c', tone: 'good', line: (c, me) => `${c} ngồi xuống cạnh ${me}, hai người không nói gì, chỉ cùng nghe tiếng thành phố thở.` },
          { label: 'Đùa một câu cho nhẹ không khí', tone: 'mid', line: (c, me) => `${c} bật cười theo câu đùa, nhưng ánh mắt vẫn còn giữ điều muốn nói.` },
          { label: 'Bảo c về ngủ đi', tone: 'bad', line: (c, me) => `${c} đứng dậy, khẽ nói "ừ" rồi đi vào, để lại khoảng trống bên cạnh ${me}.` }
        ]
      },
      {
        text: (c, me) => `Một lúc sau, ${c} kể về nỗi lo đang giữ trong lòng. Giọng ${c} nhỏ dần ở cuối câu, như sợ bị nghe thấy.`,
        options: [
          { label: 'Nghe hết, không phán xét', tone: 'good', line: (c, me) => `${c} nói hết, rồi thở ra một hơi dài, vai cũng hạ xuống nhẹ hơn.` },
          { label: 'Đưa ra lời khuyên ngay', tone: 'mid', line: (c, me) => `${c} gật đầu nghe lời khuyên, nhưng câu chuyện khép lại sớm hơn cần thiết.` },
          { label: 'Bảo chuyện đó không có gì to tát', tone: 'bad', line: (c, me) => `${c} khựng lại, rồi cười gượng: "Ừ, chắc vậy."` }
        ]
      },
      {
        text: (c, me) => `${c} quay sang nhìn thẳng vào ${me}: "Vậy theo bạn, mình là người thế nào?"`,
        options: [
          { label: 'Nói thật, dịu dàng và rõ ràng', tone: 'good', line: (c, me) => `${c} nghe xong thì đỏ mắt, quay đi rất nhanh để ${me} không thấy.` },
          { label: 'Nói chung chung cho qua', tone: 'mid', line: (c, me) => `${c} cười nhạt, nói "cảm ơn" rồi đổi chủ đề.` },
          { label: 'Trêu một câu hơi cay nghiệt', tone: 'bad', line: (c, me) => `${c} im rất lâu, rồi đứng dậy nói: "Muộn rồi, vào đi."` }
        ]
      }
    ]
  },

  date: {
    id: 'date', icon: '💞', name: 'Hẹn hò', tagline: 'Một buổi hẹn riêng',
    minLv: 8, open: false,
    rewards: { money: [0, 0, 0], box: [null, null, null], aff: [4, 6, 10] },
    closing: [
      'Buổi hẹn kết thúc sớm hơn dự tính, và cả hai đều biết lý do.',
      'Buổi hẹn trôi qua dễ chịu, đủ để cả hai muốn có lần sau.',
      'Buổi hẹn đẹp như một cảnh phim, và cả hai đều nhớ từng phút.'
    ],
    steps: [
      {
        text: (c, me) => `${c} đứng đợi ở điểm hẹn, ăn mặc kỹ hơn mọi ngày. Thấy ${me}, ${c} hơi luống cuống rồi giả vờ bình thản.`,
        options: [
          { label: 'Khen thật lòng, nhìn thẳng', tone: 'good', line: (c, me) => `${c} đỏ mặt, lúng túng kéo lại vạt áo, rồi cười rất tươi với ${me}.` },
          { label: 'Đùa cho c đỡ ngại', tone: 'mid', line: (c, me) => `${c} bật cười, không khí nhẹ đi, nhưng khoảnh khắc đẹp vừa rồi cũng tan.` },
          { label: 'Đến muộn, không báo trước', tone: 'bad', line: (c, me) => `${c} nhìn đồng hồ rồi cất điện thoại, nét mặt giấu không hết thất vọng.` }
        ]
      },
      {
        text: (c, me) => `Đứng trước hai lựa chọn của buổi hẹn, ${c} hỏi: "Bạn muốn đi đâu?"`,
        options: [
          { label: 'Hỏi lại điều c thích nhất', tone: 'good', line: (c, me) => `${c} sáng mắt kể một hơi, rồi cùng ${me} đi đúng nơi ${c} thích.` },
          { label: 'Chọn luôn cho cả hai', tone: 'mid', line: (c, me) => `${c} gật đầu đi theo, nhưng thỉnh thoảng vẫn nhìn về hướng khác.` },
          { label: 'Chỉ chọn nơi mình muốn', tone: 'bad', line: (c, me) => `${c} đi cùng, nhưng câu chuyện cứ ngắn dần.` }
        ]
      },
      {
        text: (c, me) => `Trên đường về, ${c} đi chậm hơn bình thường. Đèn đường kéo dài bóng hai người trên mặt đất.`,
        options: [
          { label: 'Nói cảm giác thật của mình', tone: 'good', line: (c, me) => `${c} dừng lại, nhìn ${me}, rồi khẽ nói: "Mình cũng vậy."` },
          { label: 'Chỉ nói vài câu xã giao', tone: 'mid', line: (c, me) => `${c} đáp lời, hai người chia tay ở ngã rẽ với một cái vẫy tay ngắn.` },
          { label: 'Cứ nhìn điện thoại suốt đường', tone: 'bad', line: (c, me) => `${c} đi bên cạnh nhưng mắt nhìn xuống, bước nhanh hơn để về sớm.` }
        ]
      }
    ]
  },

  confess: {
    id: 'confess', icon: '💌', name: 'Tỏ tình', tagline: 'Khoảnh khắc nói thật lòng',
    minLv: 20, open: false,
    rewards: { money: [0, 0, 0], box: [null, null, null], aff: [6, 10, 16] },
    closing: [
      'Khoảnh khắc ấy đi qua trong nặng nề, và cả hai đều cần thời gian.',
      'Lời tỏ tình được nói ra, chưa trọn vẹn nhưng đủ để mở một cánh cửa.',
      'Khoảnh khắc ấy khắc sâu, đến mức cả hai nhớ cả nhịp thở của mình.'
    ],
    steps: [
      {
        text: (c, me) => `${c} nhận ra ${me} đang căng thẳng. ${c} nghiêng đầu, giọng nhẹ hơn mọi khi: "Có chuyện gì phải không?"`,
        options: [
          { label: 'Thừa nhận, nói chậm từng lời', tone: 'good', line: (c, me) => `${c} nín thở nghe ${me} nói, tay ${c} siết nhẹ vào vạt áo.` },
          { label: 'Cười cho qua rồi đổi chủ đề', tone: 'mid', line: (c, me) => `${c} cười theo, nhưng ánh mắt vẫn ở lại rất lâu trên mặt ${me}.` },
          { label: 'Im lặng rồi quay đi', tone: 'bad', line: (c, me) => `${c} đứng lại một mình, môi mấp máy như muốn hỏi điều gì rồi thôi.` }
        ]
      },
      {
        text: (c, me) => `Nghe xong, ${c} hỏi rất khẽ: "Bạn có chắc không? Chắc về mình?"`,
        options: [
          { label: 'Nói rõ vì sao lại là c', tone: 'good', line: (c, me) => `${c} nghe từng lý do, mắt rưng rưng, và không còn né tránh ánh nhìn của ${me}.` },
          { label: 'Chỉ gật đầu thật mạnh', tone: 'mid', line: (c, me) => `${c} nhìn ${me} thật lâu, rồi thở ra một hơi run run.` },
          { label: 'Thúc c trả lời ngay', tone: 'bad', line: (c, me) => `${c} lùi lại nửa bước, giọng lạc đi: "Khoan đã, mình cần nghĩ."` }
        ]
      },
      {
        text: (c, me) => `${c} im lặng rất lâu. Gió đêm thổi qua, và ${c} chậm rãi ngẩng lên.`,
        options: [
          { label: 'Cho c thời gian, chờ c nói', tone: 'good', line: (c, me) => `${c} nói ra câu trả lời của mình, và khoảng cách giữa hai người không còn như trước.` },
          { label: 'Hỏi dồn cho có đáp án', tone: 'mid', line: (c, me) => `${c} trả lời trong bối rối, câu nói ra chưa kịp thành hình.` },
          { label: 'Giận rồi bỏ đi trước', tone: 'bad', line: (c, me) => `${c} đứng nhìn theo, tay buông xuống, và đêm đó không ai nhắn cho ai.` }
        ]
      }
    ]
  }
};

const THEME_ORDER = ['daily', 'work', 'mystery', 'adventure', 'night', 'date', 'confess'];

// Giữ tên MODES cho các chỗ cũ đọc được, nhưng nội dung nay là chủ đề hoạt động.
const MODES = {};
Object.keys(CHAT_THEMES).forEach(k => {
  const t = CHAT_THEMES[k];
  MODES[k] = {
    icon: t.icon,
    name: t.name,
    minLv: t.minLv,
    prompt: (n) => `[CHỦ ĐỀ ĐANG THAM GIA] Nhân vật "${n}" và người chơi đang cùng tham gia hoạt động "${t.name}" (${t.tagline}). Phản ứng của "${n}" phải dựa trên tính cách, độ thân mật và những gì đã xảy ra trong hoạt động này.`
  };
});
window.CHAT_THEMES = CHAT_THEMES;

function themeTodayKey() {
  return new Date().toDateString();
}

function ensureThemeStory(story) {
  if (!story) return null;
  if (!story.themeMemories || !Array.isArray(story.themeMemories)) story.themeMemories = [];
  if (!story.themeRuns || typeof story.themeRuns !== 'object') story.themeRuns = {};
  if (!story.characters) story.characters = [];
  const un = window.state.unlockedModes || {};
  let changed = false;
  story.characters.forEach(c => {
    if (un[c.id] && un[c.id].call && !un[c.id].adventure) { un[c.id].adventure = true; changed = true; }
  });
  const am = window.state.activeMode && window.state.activeMode[story.id];
  if (am && am.mode === 'call') { delete window.state.activeMode[story.id]; changed = true; }
  if (changed && typeof saveStorage === 'function') saveStorage();
  return story;
}

function themeSelectedChar(story) {
  const chars = (story && story.characters) || [];
  let c = chars.find(x => x.id === story.themeCharId);
  if (!c) c = chars[0] || null;
  if (c && story.themeCharId !== c.id) story.themeCharId = c.id;
  return c;
}

function themeCharLevel(charId) {
  return ((window.state.affectionLevels || {})[charId] || { level: 1 }).level;
}

function themePlayerName(story) {
  const n = String((activeStoryPersona(story) || {}).name || '').trim();
  return (!n || /^bạn$/i.test(n)) ? 'bạn' : n;
}

function themeIsUnlocked(theme, char) {
  if (!theme || !char) return false;
  if (theme.open) return true;
  const un = (window.state.unlockedModes || {})[char.id] || {};
  return !!un[theme.id];
}

function themeRewardHint(t) {
  const parts = [];
  const money = (t.rewards.money || [])[2] || 0;
  if (money > 0) parts.push('💰');
  if ((t.rewards.box || [])[2]) parts.push('📦');
  if ((t.rewards.aff || [])[2]) parts.push('❤️');
  return parts.join(' ');
}

function themeResultTier(score) {
  if (score >= 5) return 2;
  if (score >= 3) return 1;
  return 0;
}

function themeTierLabel(tier) {
  return ['Trục trặc', 'Ổn thỏa', 'Rực rỡ'][tier] || 'Ổn thỏa';
}

function themeTierIcon(tier) {
  return ['🌧️', '🌤️', '✨'][tier] || '🌤️';
}

function selectThemeChar(charId) {
  const story = window.state.stories.find(s => s.id === window.state.activeStoryId);
  if (!story || !(story.characters || []).some(c => c.id === charId)) return;
  story.themeCharId = charId;
  saveStorage();
  renderThemeTab();
}

function startThemeActivity(themeId) {
  const story = ensureThemeStory(window.state.stories.find(s => s.id === window.state.activeStoryId));
  if (!story) return;
  const theme = CHAT_THEMES[themeId];
  const char = themeSelectedChar(story);
  if (!theme || !char) return;
  if (!themeIsUnlocked(theme, char) || themeCharLevel(char.id) < theme.minLv) return;
  if (story.themeSession && !confirm('Bạn đang có một hoạt động dở. Bắt đầu chủ đề mới sẽ bỏ hoạt động đó. Tiếp tục?')) return;
  window.__themeShowHome = false;
  story.themeLastResult = null;
  story.themeSession = { themeId, charId: char.id, step: 0, score: 0, picks: [], startedAt: Date.now() };
  saveStorage();
  renderThemeTab();
}

function themeChoose(optionIndex) {
  const story = ensureThemeStory(window.state.stories.find(s => s.id === window.state.activeStoryId));
  const session = story && story.themeSession;
  if (!story || !session) return;
  const theme = CHAT_THEMES[session.themeId];
  const char = (story.characters || []).find(c => c.id === session.charId);
  if (!theme || !char) { story.themeSession = null; saveStorage(); renderThemeTab(); return; }
  const step = theme.steps[session.step];
  if (!step || !step.options[optionIndex]) return;
  const option = step.options[optionIndex];
  const me = themePlayerName(story);
  session.picks.push({
    label: option.label,
    tone: option.tone,
    line: option.line(char.name, me)
  });
  session.score += option.tone === 'good' ? 2 : (option.tone === 'mid' ? 1 : 0);
  session.step += 1;
  if (session.step >= theme.steps.length) finishThemeActivity(story, theme, char, session);
  else { saveStorage(); renderThemeTab(); }
}

function applyThemeReward(theme, tier, char) {
  const got = [];
  const money = (theme.rewards.money || [])[tier] || 0;
  if (money > 0) {
    window.state.walletBalance = (window.state.walletBalance || 0) + money;
    got.push(`💰 +${money.toLocaleString('vi-VN')}đ`);
  }
  const boxTier = (theme.rewards.box || [])[tier];
  if (boxTier && typeof addBox === 'function' && typeof THEMES !== 'undefined' && THEMES.length) {
    const craftTheme = THEMES[Math.floor(Math.random() * THEMES.length)];
    addBox(craftTheme, boxTier, 1);
    const tierObj = (typeof BOX_TIERS !== 'undefined' && BOX_TIERS[boxTier]) ? BOX_TIERS[boxTier] : { label: boxTier };
    const craftObj = (typeof CRAFTS !== 'undefined' && CRAFTS[craftTheme]) ? CRAFTS[craftTheme] : { label: craftTheme };
    got.push(`📦 Box ${tierObj.label} ${craftObj.label}`);
  }
  const aff = (theme.rewards.aff || [])[tier] || 0;
  if (aff > 0 && typeof addAffectionPoints === 'function') {
    addAffectionPoints(char.id, aff);
    got.push(`❤️ +${aff * 2} thân mật`);
  }
  return got;
}

function finishThemeActivity(story, theme, char, session) {
  const tier = themeResultTier(session.score);
  const memory = `${theme.name} cùng ${char.name}. ${session.picks.map(p => p.line).join(' ')} ${theme.closing[tier]}`;
  story.themeMemories.push({ themeId: theme.id, charId: char.id, text: memory, tier, ts: Date.now() });
  if (story.themeMemories.length > 40) story.themeMemories.splice(0, story.themeMemories.length - 40);

  const today = themeTodayKey();
  const repeat = story.themeRuns[theme.id] === today;
  let got = [];
  if (!repeat) {
    got = applyThemeReward(theme, tier, char);
    story.themeRuns[theme.id] = today;
  }

  if (!window.state.chatHistories[story.id]) window.state.chatHistories[story.id] = [];
  window.state.chatHistories[story.id].push({
    sender: 'system', event: true,
    text: `[Hoạt động: ${theme.name} với ${char.name}] ${memory}`,
    ts: Date.now()
  });

  story.themeLastResult = { themeId: theme.id, charId: char.id, tier, memory, rewards: got, repeat, ts: Date.now() };
  story.themeSession = null;
  window.__themeShowHome = false;
  saveStorage();
  renderThemeTab();
  try { if (window.state.activeStoryId === story.id) renderChatHistory(); } catch (e) {}
}

function themeBackToHome() {
  window.__themeShowHome = true;
  renderThemeTab();
}

function themeAbandonSession() {
  const story = ensureThemeStory(window.state.stories.find(s => s.id === window.state.activeStoryId));
  if (!story || !story.themeSession) return;
  if (!confirm('Bỏ hoạt động đang dở? Các bước đã chọn sẽ không được ghi vào ký ức.')) return;
  story.themeSession = null;
  saveStorage();
  window.__themeShowHome = true;
  renderThemeTab();
}

function closeThemeResult() {
  const story = window.state.stories.find(s => s.id === window.state.activeStoryId);
  if (!story) return;
  story.themeLastResult = null;
  window.__themeShowHome = true;
  saveStorage();
  renderThemeTab();
}

function renderThemeTab() {
  const root = document.getElementById('theme-body');
  if (!root) return;
  const story = ensureThemeStory(window.state.stories.find(s => s.id === window.state.activeStoryId));
  if (!story) { root.innerHTML = '<div class="theme-empty">Chưa chọn truyện.</div>'; return; }
  const chars = story.characters || [];
  if (!chars.length) {
    root.innerHTML = '<div class="theme-empty">Truyện chưa có nhân vật nào. Thêm nhân vật trong ⚙️ Cài Đặt để mở chủ đề.</div>';
    return;
  }
  if (story.themeLastResult) { renderThemeResult(story); return; }
  if (story.themeSession && !window.__themeShowHome) { renderThemeSession(story); return; }
  renderThemeHome(story);
}

function renderThemeHome(story) {
  const root = document.getElementById('theme-body');
  const char = themeSelectedChar(story);
  const today = themeTodayKey();
  const session = story.themeSession;
  const sessionTheme = session ? CHAT_THEMES[session.themeId] : null;

  const charChips = story.characters.map(c => {
    const active = char && c.id === char.id;
    return `<button class="theme-char ${active ? 'active' : ''}" onclick="selectThemeChar('${c.id}')">
      <span class="theme-char-name">${escapeHtml(c.name)}</span>
      <span class="theme-char-lv">Lv.${themeCharLevel(c.id)}</span>
    </button>`;
  }).join('');

  const cards = THEME_ORDER.map(id => {
    const t = CHAT_THEMES[id];
    if (!t) return '';
    const unlocked = themeIsUnlocked(t, char);
    const lvOk = themeCharLevel(char.id) >= t.minLv;
    const locked = !unlocked || !lvOk;
    const note = !unlocked ? 'Mở bằng nhiệm vụ' : (!lvOk ? `Cần Lv.${t.minLv}` : '');
    const done = !locked && story.themeRuns[t.id] === today;
    const onclick = locked ? '' : `onclick="startThemeActivity('${t.id}')"`;
    return `<div class="theme-card ${locked ? 'locked' : ''}" ${onclick}>
      <div class="theme-card-top"><span class="theme-card-icon">${t.icon}</span><span class="theme-card-name">${t.name}</span></div>
      <div class="theme-card-tag">${t.tagline}</div>
      <div class="theme-card-meta"><span>${t.minLv > 1 ? `Lv.${t.minLv} · ` : ''}${themeRewardHint(t)}</span>${done ? '<span class="theme-done">✓ đã nhận thưởng hôm nay</span>' : ''}</div>
      ${locked ? `<div class="theme-lock">🔒 ${note}</div>` : ''}
    </div>`;
  }).join('');

  const mems = story.themeMemories.slice(-4).reverse().map(m => {
    const t = CHAT_THEMES[m.themeId];
    return `<div class="theme-mem-line"><b>${t ? t.icon + ' ' + t.name : 'Hoạt động'}</b><span>${escapeHtml(m.text)}</span></div>`;
  }).join('');

  root.innerHTML = `
    <div class="theme-hero">
      <div class="theme-hero-title">🎭 Chủ Đề</div>
      <div class="theme-hero-sub">Chọn nhân vật và một hoạt động. Những gì xảy ra ở đây sẽ được nhân vật nhớ trong trò chuyện.</div>
    </div>
    <div class="theme-chars">${charChips}</div>
    ${sessionTheme ? `<div class="theme-resume">
      <div class="theme-resume-txt">Đang dở: <b>${sessionTheme.icon} ${sessionTheme.name}</b> · bước ${session.step + 1}/${sessionTheme.steps.length}</div>
      <div class="theme-resume-actions">
        <button class="btn btn-pink" onclick="window.__themeShowHome=false;renderThemeTab()">Tiếp tục</button>
        <button class="btn btn-outline" onclick="themeAbandonSession()">Bỏ</button>
      </div>
    </div>` : ''}
    <div class="theme-grid">${cards}</div>
    <div class="theme-mem">
      <div class="theme-mem-title">Ký ức hoạt động gần đây</div>
      ${mems || '<div class="theme-mem-empty">Chưa có hoạt động nào. Chọn một chủ đề để bắt đầu.</div>'}
    </div>
  `;
}

function renderThemeSession(story) {
  const root = document.getElementById('theme-body');
  const session = story.themeSession;
  const theme = CHAT_THEMES[session.themeId];
  const char = (story.characters || []).find(c => c.id === session.charId);
  if (!theme || !char) { story.themeSession = null; saveStorage(); renderThemeTab(); return; }
  const step = theme.steps[session.step];
  if (!step) { finishThemeActivity(story, theme, char, session); return; }
  const me = themePlayerName(story);
  const picks = session.picks.map(p => `<div class="theme-pick-line ${p.tone}">${escapeHtml(p.line)}</div>`).join('');
  const options = step.options.map((o, i) => `<button class="theme-choice" onclick="themeChoose(${i})">${escapeHtml(o.label)}</button>`).join('');
  root.innerHTML = `
    <div class="theme-session-head">
      <button class="btn btn-outline" onclick="themeBackToHome()">← Đổi chủ đề</button>
      <span class="theme-session-title">${theme.icon} ${theme.name} · ${escapeHtml(char.name)}</span>
    </div>
    <div class="theme-progress"><span style="width:${Math.round((session.step) / theme.steps.length * 100)}%"></span></div>
    <div class="theme-step-label">Bước ${session.step + 1}/${theme.steps.length}</div>
    ${picks ? `<div class="theme-picks">${picks}</div>` : ''}
    <div class="theme-scene">${escapeHtml(step.text(char.name, me))}</div>
    <div class="theme-choices">${options}</div>
  `;
}

function renderThemeResult(story) {
  const root = document.getElementById('theme-body');
  const r = story.themeLastResult;
  const theme = CHAT_THEMES[r.themeId];
  const char = (story.characters || []).find(c => c.id === r.charId);
  if (!theme || !char) { story.themeLastResult = null; saveStorage(); renderThemeTab(); return; }
  const rewards = r.rewards.length ? r.rewards.join(' · ') : (r.repeat ? 'Hôm nay đã nhận thưởng cho chủ đề này, lần này chỉ ghi ký ức.' : 'Không có phần thưởng.');
  root.innerHTML = `
    <div class="theme-result tier-${r.tier}">
      <div class="theme-result-icon">${themeTierIcon(r.tier)}</div>
      <div class="theme-result-title">${themeTierLabel(r.tier)}</div>
      <div class="theme-result-sub">${theme.icon} ${theme.name} · ${escapeHtml(char.name)}</div>
      <div class="theme-result-memory">${escapeHtml(r.memory)}</div>
      <div class="theme-result-rewards">${rewards}</div>
      <div class="theme-result-actions">
        <button class="btn btn-pink" onclick="switchStoryTab('chat')">💬 Về trò chuyện</button>
        <button class="btn btn-outline" onclick="closeThemeResult()">Chủ đề khác</button>
      </div>
    </div>
  `;
}

window.renderThemeTab = renderThemeTab;
window.startThemeActivity = startThemeActivity;
window.themeChoose = themeChoose;
window.selectThemeChar = selectThemeChar;
window.themeBackToHome = themeBackToHome;
window.themeAbandonSession = themeAbandonSession;
window.closeThemeResult = closeThemeResult;
