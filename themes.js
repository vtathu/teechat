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

// Hiệu ứng sân khấu theo không khí hoạt động
const THEME_EFFECT = {
  daily: 'sparks', work: 'sparks', mystery: 'sparks',
  adventure: 'fireworks', night: 'stars', date: 'petals', confess: 'petals'
};

// Tự gán một hoạt động riêng cho nhân vật dựa trên tính cách/lời mở đầu,
// không cho người chơi chọn tay. Kết quả lưu vào nhân vật nên ổn định sau này.
const ACTIVITY_RULES = [
  ['confess', /tỏ tình|thầm thương|thầm thích|đơn phương|crush|yêu đơn phương/i],
  ['date', /hẹn hò|tình cảm|yêu|thích|ngọt ngào|dịu dàng|lãng mạn/i],
  ['adventure', /phiêu lưu|giang hồ|kiếm khách|hiệp khách|mạo hiểm|du hành|thám hiểm|rừng|núi|biển|sa mạc/i],
  ['mystery', /điều tra|thám tử|bí ẩn|manh mối|vụ án|bí mật|huyền bí|ma|quái/i],
  ['work', /công việc|làm việc|ca làm|nhân viên|quản lý|đồng nghiệp|quán|cửa hàng|văn phòng|bác sĩ|y tá|giáo viên/i],
  ['night', /tâm sự|đêm|khó ngủ|nỗi lòng|cô đơn|ít nói|lạnh lùng/i],
  ['daily', /đời thường|nấu ăn|chợ|bếp|gia đình|hàng xóm|dọn dẹp/i]
];

function themeHash(str) {
  let h = 0;
  const s = String(str || '');
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function themeActivityIdFor(char, story) {
  if (!char) return 'daily';
  const own = [char.personality, char.firstMsg].filter(Boolean).join(' ');
  for (const [id, re] of ACTIVITY_RULES) {
    if (re.test(own)) return id;
  }
  // Không đủ dấu hiệu: chọn ổn định trong nhóm hoạt động không thiên về tình cảm
  const pool = ['daily', 'work', 'mystery', 'adventure'];
  return pool[themeHash(char.id || char.name || 'x') % pool.length];
}

// ===== Ảnh nhân vật: tự tách nền từ avatar + ảnh sân khấu do AI vẽ =====
const THEME_CUTOUT_CACHE = new Map();
const THEME_CUTOUT_QUEUE = new Map();
const THEME_ART_JOB = { charId: '' };
const THEME_IMAGE_MODELS = ['gemini-nano-banana-2.1', 'gemini-3.1-flash-image', 'gemini-2.5-flash-image'];

function themeAvatarKey(char) {
  const src = String((char && char.avatar) || '');
  return `${(char && char.id) || ''}:${src.length}:${themeHash(src)}`;
}

function themeStageArt(char) {
  const art = char && char.stageArt;
  if (!art) return '';
  if (typeof art === 'string') return art;
  if (!art.url) return '';
  if (art.activityId && char.activityId && art.activityId !== char.activityId) return '';
  return art.url;
}

function themeAutoCutout(char) {
  return THEME_CUTOUT_CACHE.get(themeAvatarKey(char)) || '';
}

function themeCharArt(char) {
  return themeStageArt(char) || (char && char.cutout) || themeAutoCutout(char) || '';
}

function themeHasApiKey() {
  return (window.state.apiKeys || []).some(k => String(k || '').trim());
}

function themeArtBusy(char) {
  return !!(char && THEME_ART_JOB.charId === char.id);
}

function themeBuildCutout(img) {
  const max = 560;
  const ratio = Math.min(1, max / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * ratio));
  const h = Math.max(1, Math.round(img.height * ratio));
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, w, h);
  const imageData = ctx.getImageData(0, 0, w, h);
  const px = imageData.data;

  const border = [];
  const step = Math.max(1, Math.round((w + h) / 260));
  const push = (x, y) => {
    const i = (y * w + x) * 4;
    border.push([px[i], px[i + 1], px[i + 2]]);
  };
  for (let x = 0; x < w; x += step) { push(x, 0); push(x, h - 1); }
  for (let y = 0; y < h; y += step) { push(0, y); push(w - 1, y); }
  if (border.length < 8) return '';

  const median = (idx) => {
    const list = border.map(v => v[idx]).sort((a, b) => a - b);
    return list[Math.floor(list.length / 2)];
  };
  const br = median(0), bg = median(1), bb = median(2);
  const dist = (r, g, b) => Math.sqrt((r - br) ** 2 + (g - bg) ** 2 + (b - bb) ** 2);
  const borderDist = border.map(v => dist(v[0], v[1], v[2])).sort((a, b) => a - b);
  const p70 = borderDist[Math.floor(borderDist.length * 0.7)];
  // Nền quá rối thì bỏ cuộc, để avatar gốc hiển thị thay vì cắt lem
  if (p70 > 60) return '';
  const tol = Math.max(34, Math.min(78, p70 + 16));

  const removed = new Uint8Array(w * h);
  const stack = [];
  const consider = (idx) => {
    if (removed[idx]) return;
    const i = idx * 4;
    if (px[i + 3] > 10 && dist(px[i], px[i + 1], px[i + 2]) < tol) {
      removed[idx] = 1;
      stack.push(idx);
    }
  };
  for (let x = 0; x < w; x++) { consider(x); consider((h - 1) * w + x); }
  for (let y = 0; y < h; y++) { consider(y * w); consider(y * w + w - 1); }
  while (stack.length) {
    const idx = stack.pop();
    const x = idx % w, y = (idx / w) | 0;
    if (x > 0) consider(idx - 1);
    if (x < w - 1) consider(idx + 1);
    if (y > 0) consider(idx - w);
    if (y < h - 1) consider(idx + w);
  }

  let removedCount = 0;
  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      if (removed[idx]) { removedCount++; continue; }
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (removedCount < w * h * 0.05 || removedCount > w * h * 0.92) return '';
  const bw = maxX - minX + 1, bh = maxY - minY + 1;
  if (bw < w * 0.08 || bh < h * 0.08) return '';

  // Làm mềm viền: pixel giáp nền được giảm alpha theo khoảng cách màu
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      if (removed[idx]) { px[idx * 4 + 3] = 0; continue; }
      const edge = (x > 0 && removed[idx - 1]) || (x < w - 1 && removed[idx + 1]) ||
        (y > 0 && removed[idx - w]) || (y < h - 1 && removed[idx + w]);
      if (edge) {
        const i = idx * 4;
        const d = dist(px[i], px[i + 1], px[i + 2]);
        px[i + 3] = Math.max(24, Math.min(255, Math.round(255 * Math.max(0, (d - tol * 0.45) / (tol * 1.1)))));
      }
    }
  }

  const padX = Math.round(bw * 0.03), padY = Math.round(bh * 0.02);
  const cropX = Math.max(0, minX - padX), cropY = Math.max(0, minY - padY);
  const cropW = Math.min(w - cropX, bw + padX * 2), cropH = Math.min(h - cropY, bh + padY * 2);
  const out = document.createElement('canvas');
  out.width = cropW; out.height = cropH;
  const octx = out.getContext('2d');
  const outData = octx.createImageData(cropW, cropH);
  for (let y = 0; y < cropH; y++) {
    const from = ((cropY + y) * w + cropX) * 4;
    const to = y * cropW * 4;
    outData.data.set(px.subarray(from, from + cropW * 4), to);
  }
  octx.putImageData(outData, 0, 0);
  return out.toDataURL('image/png');
}

function themeMakeCutout(src) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      try { resolve(themeBuildCutout(img) || ''); } catch (e) { resolve(''); }
    };
    img.onerror = () => resolve('');
    img.src = src;
  });
}

function themeEnsureAutoCutout(char, onReady) {
  if (!char || char.cutout || !char.avatar || String(char.avatar).indexOf('data:image/') !== 0) return;
  const key = themeAvatarKey(char);
  if (THEME_CUTOUT_CACHE.has(key)) { onReady(THEME_CUTOUT_CACHE.get(key)); return; }
  if (THEME_CUTOUT_QUEUE.has(key)) { THEME_CUTOUT_QUEUE.get(key).push(onReady); return; }
  const waiters = [onReady];
  THEME_CUTOUT_QUEUE.set(key, waiters);
  themeMakeCutout(char.avatar).then(url => {
    THEME_CUTOUT_QUEUE.delete(key);
    if (url) THEME_CUTOUT_CACHE.set(key, url);
    waiters.forEach(fn => { try { fn(url); } catch (e) {} });
  });
}

function themeArtPrompt(story, char, theme) {
  const setting = String((story && story.setting) || '').trim();
  return [
    'Vertical 9:16 cinematic webtoon illustration for a mobile visual-novel stage.',
    `Character: ${char.name}. Personality: ${char.personality || 'natural and expressive'}.`,
    `Story setting: ${setting || 'a warm everyday world'}.`,
    `Activity scene: ${theme.name} - ${theme.tagline}.`,
    'Draw the character full body or three-quarter body, standing on the right side of the frame, looking toward the viewer, with a pose and expression that fit the personality and the activity.',
    'Keep the face, hairstyle, skin tone, body type and outfit consistent with the reference image if one is provided.',
    'Warm cinematic lighting, detailed environment, polished webtoon art, high detail.',
    'Leave the lower third darker and less busy for a dialogue panel overlay.',
    'No text, no watermark, no speech bubbles, no comic panels, no borders, no UI elements.'
  ].join(' ');
}

function themeBlobBase64(blob) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => {
      const s = String(reader.result || '');
      resolve(s.indexOf(',') >= 0 ? s.slice(s.indexOf(',') + 1) : '');
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(blob);
  });
}

async function themeImageInline(src) {
  const s = String(src || '');
  const m = s.match(/^data:(image\/[a-z0-9.+-]+);base64,([\s\S]+)$/i);
  if (m) return { mime_type: m[1], data: m[2] };
  if (!/^https?:/i.test(s)) return null;
  try {
    const res = await fetch(s);
    if (!res.ok) return null;
    const blob = await res.blob();
    if (!/^image\//.test(blob.type)) return null;
    const data = await themeBlobBase64(blob);
    return data ? { mime_type: blob.type, data } : null;
  } catch (e) { return null; }
}

async function themeRequestArt(key, prompt, image) {
  let last = '';
  for (const model of THEME_IMAGE_MODELS) {
    try {
      const input = [{ type: 'text', text: prompt }];
      if (image) input.push({ type: 'image', mime_type: image.mime_type, data: image.data });
      const res = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': key,
          'Api-Revision': '2026-05-20'
        },
        body: JSON.stringify({
          model,
          input,
          response_format: { type: 'image', mime_type: 'image/jpeg', aspect_ratio: '9:16', image_size: '1K' }
        })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        const out = data.output_image || (Array.isArray(data.outputs) ? data.outputs.find(o => o && (o.type === 'image' || o.data)) : null);
        if (out && out.data) {
          const mime = out.mime_type || out.mimeType || 'image/jpeg';
          return { dataUrl: `data:${mime};base64,${out.data}`, model };
        }
        last = 'API không trả về ảnh';
      } else {
        last = (data.error && data.error.message) || ('HTTP ' + res.status);
      }
    } catch (e) { last = e.message; }
  }

  // Key cũ chỉ hỗ trợ model ảnh qua generateContent
  for (const model of ['gemini-2.5-flash-image', 'gemini-2.5-flash-image-preview']) {
    try {
      const parts = [{ text: prompt }];
      if (image) parts.push({ inline_data: { mime_type: image.mime_type, data: image.data } });
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({
          contents: [{ role: 'user', parts }],
          generationConfig: { responseModalities: ['TEXT', 'IMAGE'], imageConfig: { aspectRatio: '9:16' } }
        })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        const partsOut = (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) || [];
        const part = partsOut.find(p => p && (p.inlineData || p.inline_data));
        if (part) {
          const inline = part.inlineData || part.inline_data;
          const mime = inline.mimeType || inline.mime_type || 'image/png';
          return { dataUrl: `data:${mime};base64,${inline.data}`, model };
        }
        last = 'API không trả về ảnh';
      } else {
        last = (data.error && data.error.message) || ('HTTP ' + res.status);
      }
    } catch (e) { last = e.message; }
  }
  throw new Error(last || 'Không tạo được ảnh');
}

function themeFitArt(dataUrl) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      try {
        const maxW = 900, maxH = 1350;
        const ratio = Math.min(1, maxW / img.width, maxH / img.height);
        const w = Math.max(1, Math.round(img.width * ratio));
        const h = Math.max(1, Math.round(img.height * ratio));
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#141020';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      } catch (e) { resolve(dataUrl); }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

async function generateThemeArt() {
  if (THEME_ART_JOB.charId) return;
  const story = ensureThemeStory(window.state.stories.find(s => s.id === window.state.activeStoryId));
  if (!story) return;
  const session = story.themeSession;
  const char = session
    ? (story.characters || []).find(c => c.id === session.charId)
    : themeSelectedChar(story);
  if (!char) return;
  const theme = CHAT_THEMES[char.activityId] || CHAT_THEMES.daily;
  const keys = (window.state.apiKeys || [])
    .map(k => String(k).trim().replace(/^["']|["']$/g, ''))
    .filter(Boolean);
  if (!keys.length) {
    alert('Chưa có API key để tạo ảnh. Thêm key trong ⚙️ Cài Đặt.');
    return;
  }

  THEME_ART_JOB.charId = char.id;
  renderThemeTab();
  try {
    const image = await themeImageInline(char.avatar);
    const prompt = themeArtPrompt(story, char, theme);
    let result = null, lastErr = null;
    for (const key of keys) {
      try {
        result = await themeRequestArt(key, prompt, image);
        if (result) break;
      } catch (e) { lastErr = e; }
    }
    if (!result) throw lastErr || new Error('Không tạo được ảnh');
    const url = await themeFitArt(result.dataUrl);
    char.stageArt = { url, activityId: char.activityId, at: Date.now(), model: result.model || '' };
    saveStorage();
  } catch (e) {
    alert('Không tạo được ảnh: ' + String((e && e.message) || e).slice(0, 180));
  } finally {
    THEME_ART_JOB.charId = '';
    renderThemeTab();
  }
}

function themeFxHtml(kind) {
  let spans = '';
  if (kind === 'petals') {
    for (let i = 0; i < 12; i++) spans += `<i class="fx-petal" style="left:${(i * 8 + 5) % 100}%;animation-delay:${(i % 6) * 0.8}s;animation-duration:${5 + (i % 4)}s"></i>`;
  } else if (kind === 'fireworks') {
    for (let i = 0; i < 3; i++) spans += `<i class="fx-burst" style="left:${20 + i * 30}%;top:${18 + (i % 2) * 12}%;animation-delay:${i * 1.1}s"></i>`;
  } else if (kind === 'stars') {
    for (let i = 0; i < 16; i++) spans += `<i class="fx-star" style="left:${(i * 6 + 3) % 100}%;top:${(i * 13) % 60}%;animation-delay:${(i % 7) * 0.5}s"></i>`;
  } else {
    for (let i = 0; i < 10; i++) spans += `<i class="fx-spark" style="left:${(i * 9 + 4) % 100}%;top:${(i * 17 + 10) % 70}%;animation-delay:${(i % 5) * 0.6}s"></i>`;
  }
  return `<div class="activity-fx" aria-hidden="true">${spans}</div>`;
}

function themeTodayKey() {
  return new Date().toDateString();
}

// Phiếu không bị tiêu: mỗi ngày được nhận thưởng tối đa 3 lượt cho mỗi truyện,
// các lượt sau vẫn chơi được nhưng chỉ ghi ký ức
const THEME_REWARD_RUNS = 3;
const THEME_TICKET_DROP_CHANCE = 0.02;
const THEME_TICKET_DAILY_CAP = 3;

function themeDailyCount(story) {
  const today = themeTodayKey();
  if (!story.themeDaily || typeof story.themeDaily !== 'object' || story.themeDaily.date !== today) {
    story.themeDaily = { date: today, runs: 0 };
  }
  if (typeof story.themeDaily.runs !== 'number') story.themeDaily.runs = 0;
  return story.themeDaily;
}

function themeTicketDay() {
  const today = themeTodayKey();
  if (!window.state.activityTicketDay || typeof window.state.activityTicketDay !== 'object' || window.state.activityTicketDay.date !== today) {
    window.state.activityTicketDay = { date: today, n: 0 };
  }
  if (typeof window.state.activityTicketDay.n !== 'number') window.state.activityTicketDay.n = 0;
  return window.state.activityTicketDay;
}

// Phiếu chỉ rơi rất hiếm sau một ca làm, tối đa 3 phiếu/ngày.
// Phiếu của nhân vật chưa đủ cấp là vé mở sớm, dùng một lần là mở luôn.
function themeMaybeDropTicket() {
  const day = themeTicketDay();
  if (day.n >= THEME_TICKET_DAILY_CAP) return null;
  if (Math.random() > THEME_TICKET_DROP_CHANCE) return null;
  const stories = (window.state.stories || []).filter(s => s && Array.isArray(s.characters) && s.characters.length);
  if (!stories.length) return null;
  for (let i = 0; i < 6; i++) {
    const story = stories[Math.floor(Math.random() * stories.length)];
    const char = story.characters[Math.floor(Math.random() * story.characters.length)];
    if (!char) continue;
    if (!char.activityId || !CHAT_THEMES[char.activityId]) char.activityId = themeActivityIdFor(char, story);
    const theme = CHAT_THEMES[char.activityId];
    if (!theme) continue;
    if (themeActivityItemFor(story, char)) continue;
    const item = themeGrantActivityItem(story, char);
    if (!item) continue;
    day.n++;
    if (typeof saveStorage === 'function') saveStorage();
    return item;
  }
  return null;
}

function ensureThemeStory(story) {
  if (!story) return null;
  if (!story.themeMemories || !Array.isArray(story.themeMemories)) story.themeMemories = [];
  if (!story.themeRuns || typeof story.themeRuns !== 'object') story.themeRuns = {};
  if (!story.activityUnlocks || typeof story.activityUnlocks !== 'object') story.activityUnlocks = {};
  if (!story.characters) story.characters = [];
  const un = window.state.unlockedModes || {};
  let changed = false;
  story.characters.forEach(c => {
    // Mỗi nhân vật có một hoạt động riêng, gán một lần rồi giữ nguyên
    if (!c.activityId || !CHAT_THEMES[c.activityId]) {
      c.activityId = themeActivityIdFor(c, story);
      changed = true;
    }
    if (un[c.id]) {
      if (un[c.id].call && !un[c.id].adventure) { un[c.id].adventure = true; changed = true; }
      // Save cũ đã mở khóa bằng nhiệm vụ -> chuyển thành mở sớm hoạt động riêng
      const hadLegacy = Object.keys(un[c.id]).some(k => un[c.id][k] === true);
      if (hadLegacy && !story.activityUnlocks[c.id]) { story.activityUnlocks[c.id] = true; changed = true; }
    }
    // Đủ cấp hoặc đã mở từ trước thì cấp phiếu vào túi một lần, không tự mở hoạt động
    const theme = CHAT_THEMES[c.activityId];
    if (theme && themeIsUnlocked(theme, c, story)) {
      const before = (window.state.inventory || []).length;
      const item = themeGrantActivityItem(story, c);
      if ((window.state.inventory || []).length !== before) changed = true;
      if (item && themeRefreshActivityItem(item, story, c)) changed = true;
    }
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

function themeAffectionStage(lv) {
  if (lv >= 60) return 'Tri kỷ';
  if (lv >= 40) return 'Tâm giao';
  if (lv >= 20) return 'Hảo hữu';
  if (lv >= 10) return 'Thân thiết';
  return 'Mới quen';
}

// Cài đặt nhân vật ghi xưng hô trong phần tính cách, dạng "xưng hô Anh - em"
function themePronounPair(char) {
  const p = String((char && char.personality) || '');
  const m = p.match(/xưng\s*hô\s*[:\-–—]?\s*([^\n.;()]{2,50})/i);
  if (!m) return null;
  const pair = m[1].split(/\s*(?:[-–—\/,]|\bvà\b|\bvới\b)\s*/i)
    .map(s => s.replace(/[.\s]+$/, '').trim()).filter(Boolean);
  if (pair.length < 2) return null;
  return { self: pair[0].slice(0, 12), you: pair[1].slice(0, 12) };
}

function themePlayerName(story) {
  const n = String((activeStoryPersona(story) || {}).name || '').trim();
  return (!n || /^bạn$/i.test(n)) ? 'bạn' : n;
}

function themeIsUnlocked(theme, char, story) {
  if (!theme || !char) return false;
  if (themeCharLevel(char.id) >= theme.minLv) return true;
  if (story && story.activityUnlocks && story.activityUnlocks[char.id]) return true;
  const legacy = (window.state.unlockedModes || {})[char.id] || {};
  return !!(legacy[theme.id] || (char.activityId && legacy[char.activityId]));
}

// Hoạt động là một phiếu nằm trong túi: nhận từ nhiệm vụ hoặc đủ cấp thân mật,
// chỉ mở khi người chơi bấm Dùng. Phiếu giữ lại để chơi lại các ngày sau.
function themeActivityItemFor(story, char) {
  if (!story || !char) return null;
  return (window.state.inventory || []).find(it =>
    it && it.cat === 'activity' && it.storyId === story.id && it.charId === char.id) || null;
}

function themeRefreshActivityItem(item, story, char) {
  if (!item || !story || !char) return false;
  const theme = CHAT_THEMES[char.activityId] || CHAT_THEMES[item.themeId] || CHAT_THEMES.daily;
  const name = `Phiếu hoạt động: ${theme.icon} ${theme.name} · ${char.name}`;
  const desc = `${theme.tagline} · ${themeAffectionStage(themeCharLevel(char.id))} · ${story.title || ''}`;
  const changed = item.name !== name || item.desc !== desc || item.themeId !== theme.id;
  item.name = name;
  item.desc = desc;
  item.themeId = theme.id;
  return changed;
}

function themeGrantActivityItem(story, char) {
  if (!story || !char) return null;
  const existing = themeActivityItemFor(story, char);
  if (existing) { themeRefreshActivityItem(existing, story, char); return existing; }
  const theme = CHAT_THEMES[char.activityId] || CHAT_THEMES.daily;
  if (!window.state.inventory) window.state.inventory = [];
  const item = {
    uniqueId: 'act-' + char.id + '-' + Date.now(),
    cat: 'activity',
    name: '',
    desc: '',
    storyId: story.id,
    charId: char.id,
    themeId: theme.id,
    qty: 1,
    paid: 0
  };
  themeRefreshActivityItem(item, story, char);
  window.state.inventory.push(item);
  return item;
}

function themeOpenOverlay() {
  const ov = document.getElementById('activity-overlay');
  if (!ov) return;
  ov.classList.remove('hidden');
  document.body.classList.add('activity-open');
}

function themeCloseOverlay() {
  const ov = document.getElementById('activity-overlay');
  if (ov) ov.classList.add('hidden');
  document.body.classList.remove('activity-open');
}

function useActivityItem(uid) {
  const item = (window.state.inventory || []).find(it => it && it.cat === 'activity' && it.uniqueId === uid);
  if (!item) return;
  const story = (window.state.stories || []).find(s => s.id === item.storyId);
  if (!story) return alert('Truyện của phiếu hoạt động này không còn trong danh sách.');
  if (typeof openStoryDetail === 'function') openStoryDetail(story.id);
  const char = (story.characters || []).find(c => c.id === item.charId);
  if (!char) return alert('Nhân vật của phiếu hoạt động này không còn trong truyện.');
  ensureThemeStory(story);
  const theme = CHAT_THEMES[char.activityId] || CHAT_THEMES[item.themeId] || CHAT_THEMES.daily;
  story.themeCharId = char.id;
  if (!story.activityUnlocks) story.activityUnlocks = {};
  story.activityUnlocks[char.id] = true;
  window.__themeShowHome = false;
  if (typeof saveStorage === 'function') saveStorage();
  themeOpenOverlay();
  if (!story.themeSession) themeBeginSession(story, theme, char);
  else renderThemeTab();
  if (typeof closeModal === 'function') closeModal('modal-activity-reward');
}

function themeShowRewardItems(got, items) {
  const body = document.getElementById('activity-reward-body');
  if (!body || !items || !items.length) return false;
  body.innerHTML = (got || []).map(t => `<div class="activity-reward-line">${escapeHtml(t)}</div>`).join('') +
    items.map(it => `<div class="activity-reward-item">
      <div class="activity-reward-name">${escapeHtml(it.name)}<span>${escapeHtml(it.desc)}</span></div>
      <div class="activity-reward-actions">
        <button class="btn btn-pink" onclick="themeUseGrantedItem('${it.uniqueId}')">▶ Dùng</button>
        <button class="btn btn-outline" onclick="closeModal('modal-activity-reward')">Cất vào túi</button>
      </div>
    </div>`).join('');
  if (typeof openModal !== 'function') return false;
  openModal('modal-activity-reward');
  return true;
}

function themeUseGrantedItem(uid) {
  if (typeof closeModal === 'function') closeModal('modal-activity-reward');
  useActivityItem(uid);
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
  const char = themeSelectedChar(story);
  if (!char) return;
  // Chỉ có một hoạt động riêng cho mỗi nhân vật; tham số themeId chỉ để tương thích lời gọi cũ
  const theme = CHAT_THEMES[char.activityId] || CHAT_THEMES[themeId];
  if (!theme) return;
  if (!themeIsUnlocked(theme, char, story)) return;
  if (story.themeSession && !confirm('Bạn đang có một hoạt động dở. Bắt đầu hoạt động mới sẽ bỏ hoạt động đó. Tiếp tục?')) return;
  themeBeginSession(story, theme, char);
}

// Hoạt động AI dẫn: mỗi lượt sinh cảnh mới nối tiếp câu trả lời trước.
// Không có key hoặc AI lỗi ở cảnh đầu thì rơi về kịch bản cố định để vẫn chơi được.
function themeBeginSession(story, theme, char) {
  window.__themeShowHome = false;
  story.themeLastResult = null;
  if (themeHasApiKey()) {
    story.themeSession = {
      themeId: theme.id, charId: char.id, step: 0, score: 0, picks: [],
      startedAt: Date.now(), dyn: 1, log: [], beat: null, busy: true, error: '', pending: null
    };
    if (typeof saveStorage === 'function') saveStorage();
    renderThemeTab();
    themeDynAdvance(story, story.themeSession, null);
    return;
  }
  story.themeSession = { themeId: theme.id, charId: char.id, step: 0, score: 0, picks: [], startedAt: Date.now() };
  if (typeof saveStorage === 'function') saveStorage();
  renderThemeTab();
}

function themeChoose(optionIndex) {
  const story = ensureThemeStory(window.state.stories.find(s => s.id === window.state.activeStoryId));
  const session = story && story.themeSession;
  if (!story || !session) return;
  if (session.dyn) { themeDynChoice(optionIndex); return; }
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

// Người chơi tự soạn câu trả lời thay vì chọn câu mẫu
function themeFreeReply() {
  const story = ensureThemeStory(window.state.stories.find(s => s.id === window.state.activeStoryId));
  const session = story && story.themeSession;
  if (!story || !session) return;
  const input = document.getElementById('activity-free-input');
  const text = String((input && input.value) || '').trim().slice(0, 200);
  if (!text) return;
  if (session.dyn) { themeDynSubmit(text, themeInputMode(text)); return; }
  const theme = CHAT_THEMES[session.themeId];
  const char = (story.characters || []).find(c => c.id === session.charId);
  if (!theme || !char) { story.themeSession = null; saveStorage(); renderThemeTab(); return; }
  const me = themePlayerName(story);
  session.picks.push({
    label: text,
    tone: 'mid',
    line: `${me} nói: "${text}". ${char.name} nghe trọn câu rồi mới đáp lại.`
  });
  session.score += 1;
  session.step += 1;
  if (session.step >= theme.steps.length) finishThemeActivity(story, theme, char, session);
  else { saveStorage(); renderThemeTab(); }
}

// ===== Hoạt động do AI dẫn =====
// Cảnh, lời thoại và gợi ý đều sinh theo thân mật + chat + ký ức; lượt sau nối từ lượt trước.
const THEME_AI_ROUNDS = 3;

// Tự soạn: *...* hoặc (...) là hành động, "..." là lời nói, còn lại để AI tự hiểu
function themeInputMode(text) {
  const t = String(text || '').trim();
  if (/^\*[^*\n]+\*$/.test(t) || /^\([^)\n]+\)$/.test(t)) return 'action';
  if (/^["“«][\s\S]*["”»]$/.test(t)) return 'say';
  return 'free';
}

function themeModeLabel(mode) {
  return mode === 'action' ? 'hành động' : (mode === 'say' ? 'lời nói' : 'tự do');
}

function themeDynTotal(session, theme) {
  if (session && session.dyn) return THEME_AI_ROUNDS;
  return (theme && theme.steps && theme.steps.length) || THEME_AI_ROUNDS;
}

async function themeAiText(prompt, temperature) {
  const keys = (window.state.apiKeys || [])
    .map(k => String(k).trim().replace(/^["']|["']$/g, ''))
    .filter(Boolean);
  const model = String(window.state.currentModel || 'gemini-2.5-flash').trim().replace(/^models\//, '');
  for (const key of keys) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: typeof temperature === 'number' ? temperature : 0.9 }
        })
      });
      if (!res.ok) continue;
      const data = await res.json().catch(() => ({}));
      const parts = (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) || [];
      const text = parts.map(p => (p && p.text) || '').join('').trim();
      if (text) return text;
    } catch (e) {}
  }
  return '';
}

function themeParseJson(text) {
  let s = String(text || '').replace(/\r/g, '').trim();
  s = s.replace(/```(?:json)?/gi, '');
  const a = s.indexOf('{'), b = s.lastIndexOf('}');
  if (a < 0 || b <= a) return null;
  const raw = s.slice(a, b + 1);
  try { return JSON.parse(raw); } catch (e) {}
  // Model đôi khi xuống dòng thật bên trong chuỗi JSON
  let fixed = '', inStr = false, esc = false;
  for (const ch of raw) {
    if (inStr) {
      if (esc) { fixed += ch; esc = false; continue; }
      if (ch === '\\') { fixed += ch; esc = true; continue; }
      if (ch === '"') { inStr = false; fixed += ch; continue; }
      if (ch === '\n') { fixed += '\\n'; continue; }
      fixed += ch;
    } else {
      if (ch === '"') inStr = true;
      fixed += ch;
    }
  }
  try { return JSON.parse(fixed); } catch (e) { return null; }
}

function themeDynContext(story, char) {
  const me = themePlayerName(story);
  const persona = (typeof activeStoryPersona === 'function' ? activeStoryPersona(story) : null) || {};
  const aff = (window.state.affectionLevels || {})[char.id] || { level: 1 };
  const lv = aff.level || 1;
  const pr = themePronounPair(char);
  const setting = String(story.setting || '').replace(/\s+/g, ' ').slice(0, 700);
  const others = (story.characters || []).filter(c => c.id !== char.id).map(c => c.name).join(', ');
  const hist = ((window.state.chatHistories || {})[story.id] || [])
    .filter(m => m && (m.sender === 'user' || m.sender === 'ai'))
    .slice(-6)
    .map(m => `${m.sender === 'user' ? me : char.name}: ${String(m.text || '').replace(/\s+/g, ' ').slice(0, 200)}`)
    .join('\n');
  const mems = (story.themeMemories || []).slice(-3)
    .map(m => `- ${String(m.text || '').replace(/\s+/g, ' ').slice(0, 220)}`)
    .join('\n');
  return [
    `[NHÂN VẬT] ${char.name}`,
    `[TÍNH CÁCH] ${String(char.personality || '(không ghi)').slice(0, 500)}`,
    `[NGƯỜI CHƠI] ${me}${persona.memories ? ' — ' + String(persona.memories).slice(0, 250) : ''}`,
    `[QUAN HỆ] ${themeAffectionStage(lv)} · Lv.${lv}`,
    `[XƯNG HÔ] ${pr ? `${char.name} xưng "${pr.self}", gọi người chơi là "${pr.you}"` : 'chưa ghi trong hồ sơ — tự chọn cặp xưng hô hợp tuổi, tính cách và quan hệ rồi giữ cố định'}`,
    `[TRUYỆN] ${String(story.title || '').slice(0, 80)}`,
    `[BỐI CẢNH] ${setting || '(không có)'}`,
    others ? `[NHÂN VẬT KHÁC trong truyện, chỉ đưa vào nếu thật cần] ${others}` : '',
    '[CHAT GẦN ĐÂY]',
    hist || '- (chưa có)',
    '[KÝ ỨC HOẠT ĐỘNG CŨ]',
    mems || '- (chưa có)'
  ].filter(Boolean).join('\n');
}

function themeDynTranscript(session) {
  return (session.log || []).filter(e => e && e.text).map(e => {
    const who = e.k === 'me' ? `NGƯỜI CHƠI (${themeModeLabel(e.mode)})`
      : e.k === 'char' ? 'NHÂN VẬT'
      : e.k === 'closing' ? 'KHÉP LẠI' : 'DIỄN BIẾN';
    return `${who}: ${e.text}`;
  }).join('\n') || '(chưa có)';
}

function themeDynPrompt(story, theme, char, session, input) {
  const round = (session.step || 0) + 1;
  const mustEnd = round >= THEME_AI_ROUNDS;
  const inputBlock = input
    ? `[NGƯỜI CHƠI VỪA] (${themeModeLabel(input.mode)}) ${input.text}`
    : '[MỞ CẢNH] Người chơi chưa làm gì. Hãy mở cảnh và mời người chơi tham gia.';
  const currentBeat = session.beat && !session.beat.end
    ? `[NHỊP NGAY TRƯỚC] ${session.beat.narration || ''} ${session.beat.line || ''}`.trim()
    : '';
  return `Bạn dẫn một hoạt động đời thường ngắn trong ứng dụng trò chuyện. Đây KHÔNG phải khung chat: không có tin nhắn, không ai cầm điện thoại. Hãy viết như một đoạn truyện ngắn tương tác, mỗi lượt là một khoảnh khắc nhỏ, chậm và cụ thể.

${themeDynContext(story, char)}

[HOẠT ĐỘNG] ${theme.name} — ${theme.tagline}
${currentBeat}
[DIỄN BIẾN ĐÃ XẢY RA]
${themeDynTranscript(session)}

${inputBlock}
[LƯỢT] ${round}/${THEME_AI_ROUNDS}${mustEnd ? ' — ĐÂY LÀ LƯỢT CUỐI, BẮT BUỘC KHÉP LẠI' : ''}

[QUY TẮC]
1. Tình huống phải cụ thể, mới, hợp tính cách ${char.name}, quan hệ ${themeAffectionStage(themeCharLevel(char.id))} (Lv.${themeCharLevel(char.id)}), bối cảnh truyện, những gì đã xảy ra trong chat và ký ức cũ. Cảnh mở đầu phải nối tiếp tự nhiên từ [CHAT GẦN ĐÂY] và [BỐI CẢNH], không bỏ qua mốc truyện, không mở đầu lại từ đầu. Không lặp lại hoạt động đã có trong ký ức.
2. TUYỆT ĐỐI không viết lời nói, hành động, suy nghĩ hay cảm xúc thay người chơi; không nhắc lại nguyên văn lời người chơi vừa nói; chỉ tả phản ứng bên ngoài của nhân vật và điều xảy ra trong cảnh.
3. "narration" là 1-2 câu tả cảnh và phản ứng của nhân vật ngay sau điều người chơi vừa làm. "line" là lời thoại hoặc hành động tiếp theo của nhân vật, đúng khẩu khí.
4. "choices" gồm 2-3 câu trả lời gợi ý cho người chơi ở ngôi của họ. Mỗi câu một thái độ khác nhau, đều tự nhiên và hợp lý; KHÔNG có lựa chọn đúng/sai, không gắn nhãn tốt/xấu. Tối đa một câu viết dạng hành động trong dấu *...*.
5. Nếu đã đủ ${THEME_AI_ROUNDS} lượt hoặc cảnh đã tới chỗ khép tự nhiên (không sớm hơn lượt 2), trả "choices": [] kèm "closing": 1-2 câu khép lại buổi và "end": true. Lượt cuối bắt buộc khép.
6. Tiếng Việt có dấu, đúng từ điển, câu hoàn chỉnh; không markdown, không tiêu đề, không nhắc hệ thống, điểm số hay phần thưởng.
7. Giữ đúng [XƯNG HÔ] và [QUAN HỆ] suốt hoạt động: không tự đổi cặp xưng hô, cách gọi phải khớp tuổi và tính cách; mức thân mật thấp thì giữ ý, chưa vội thân mật, mức cao thì gần gũi tự nhiên; không đi trước diễn biến truyện.

Chỉ trả về một JSON đúng định dạng, không thêm chữ nào khác:
{"narration":"...","line":"...","choices":["...","..."]}
Khi khép: {"narration":"...","line":"...","choices":[],"closing":"...","end":true}`;
}

function themeDynBeat(data, session) {
  if (!data || typeof data !== 'object') return null;
  const pick = v => String(v == null ? '' : v).trim();
  const narration = pick(data.narration).slice(0, 700);
  const line = pick(data.line).slice(0, 500);
  let choices = Array.isArray(data.choices) ? data.choices.map(pick).filter(Boolean).slice(0, 3) : [];
  const closing = pick(data.closing).slice(0, 600);
  let end = !!data.end || (!choices.length && !!closing);
  if (((session && session.step) || 0) < 1) end = false;
  if (!narration && !line) return null;
  if (end) choices = [];
  return { narration, line, choices, closing, end };
}

async function themeDynAdvance(story, session, input) {
  if (!story || !session || !session.dyn) return;
  const theme = CHAT_THEMES[session.themeId];
  const char = (story.characters || []).find(c => c.id === session.charId);
  if (!theme || !char) { story.themeSession = null; saveStorage(); renderThemeTab(); return; }
  session.busy = true;
  session.error = '';
  saveStorage();
  renderThemeTab();

  let beat = null;
  try {
    const raw = await themeAiText(themeDynPrompt(story, theme, char, session, input), 0.9);
    beat = themeDynBeat(themeParseJson(raw), session);
  } catch (e) {}

  // Người chơi đã bỏ hoạt động trong lúc chờ
  if (story.themeSession !== session) return;
  session.busy = false;

  if (!beat) {
    if (!input) {
      // Không gọi được AI ở cảnh đầu: quay về kịch bản cố định, không mất lượt chơi
      session.dyn = 0;
      session.log = [];
      session.pending = null;
      session.pendingEcho = null;
      saveStorage();
      renderThemeTab();
      return;
    }
    session.error = 'Chưa nối được AI, bạn thử lại nhé.';
    saveStorage();
    renderThemeTab();
    return;
  }

  if (input) {
    const prev = session.beat;
    if (prev && !prev.end) {
      if (prev.narration) session.log.push({ k: 'nar', text: prev.narration });
      if (prev.line) session.log.push({ k: 'char', text: prev.line });
    }
    session.log.push({ k: 'me', text: input.text, mode: input.mode || themeInputMode(input.text) });
    const line = [beat.narration, beat.line].filter(Boolean).join(' ');
    session.picks.push({ label: input.text, mode: input.mode, line });
    session.step = (session.step || 0) + 1;
    session.pending = null;
    session.pendingEcho = null;
  }

  if (beat.end) {
    if (beat.narration) session.log.push({ k: 'nar', text: beat.narration });
    if (beat.line) session.log.push({ k: 'char', text: beat.line });
    session.closing = beat.closing || beat.narration || '';
    session.beat = { end: true, choices: [] };
  } else {
    session.beat = beat;
  }
  saveStorage();
  renderThemeTab();
}

function themeDynSubmit(text, mode) {
  const story = window.state.stories.find(s => s.id === window.state.activeStoryId);
  const session = story && story.themeSession;
  if (!story || !session || !session.dyn || session.busy) return;
  if (!session.beat || session.beat.end) return;
  const clean = String(text || '').trim().slice(0, 200);
  if (!clean) return;
  const m = mode || themeInputMode(clean);
  session.pending = { text: clean, mode: m };
  session.pendingEcho = { text: clean, mode: m };
  themeDynAdvance(story, session, session.pending);
}

function themeDynChoice(index) {
  const story = window.state.stories.find(s => s.id === window.state.activeStoryId);
  const session = story && story.themeSession;
  if (!story || !session || !session.dyn || session.busy) return;
  const beat = session.beat;
  const text = beat && !beat.end ? (beat.choices || [])[index] : '';
  if (!text) return;
  themeDynSubmit(text, themeInputMode(text));
}

function themeDynRetry() {
  const story = window.state.stories.find(s => s.id === window.state.activeStoryId);
  const session = story && story.themeSession;
  if (!story || !session || !session.dyn || session.busy || !session.pending) return;
  themeDynAdvance(story, session, session.pending);
}

function themeDynFinish() {
  const story = window.state.stories.find(s => s.id === window.state.activeStoryId);
  const session = story && story.themeSession;
  if (!story || !session || !session.dyn) return;
  if (!session.beat || !session.beat.end) return;
  const theme = CHAT_THEMES[session.themeId];
  const char = (story.characters || []).find(c => c.id === session.charId);
  if (!theme || !char) { story.themeSession = null; saveStorage(); renderThemeTab(); return; }
  finishThemeActivity(story, theme, char, session);
}

// Ký ức ghi lại diễn biến thật của buổi, để chat và nhật ký nhớ đúng chuyện đã xảy ra
function themeDynMemory(story, theme, char, session) {
  const parts = [];
  (session.log || []).forEach(e => {
    if (e && (e.k === 'nar' || e.k === 'closing') && e.text) parts.push(e.text);
  });
  if (!parts.length) {
    parts.push((session.picks || []).map(p => p.line).filter(Boolean).join(' '));
  }
  if (session.closing && !parts.some(p => p.indexOf(session.closing) >= 0)) parts.push(session.closing);
  const text = `${theme.name} cùng ${char.name}. ${parts.join(' ')}`.replace(/\s+/g, ' ').trim();
  return text.slice(0, 700);
}

// Thưởng ngẫu nhiên như quà thường ngày, không phụ thuộc câu trả lời "đúng/sai"
function applyThemeReward(theme, char, tierOverride) {
  const got = [];
  const roll = Math.random();
  const tier = typeof tierOverride === 'number' ? tierOverride : (roll < 0.2 ? 2 : (roll < 0.55 ? 1 : 0));
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
  const dyn = !!session.dyn;
  const roll = Math.random();
  const tier = dyn ? (roll < 0.2 ? 2 : (roll < 0.55 ? 1 : 0)) : themeResultTier(session.score);
  const memory = dyn
    ? themeDynMemory(story, theme, char, session)
    : `${theme.name} cùng ${char.name}. ${session.picks.map(p => p.line).join(' ')} ${theme.closing[tier]}`;
  story.themeMemories.push({ themeId: theme.id, charId: char.id, text: memory, tier, ts: Date.now() });
  if (story.themeMemories.length > 40) story.themeMemories.splice(0, story.themeMemories.length - 40);
  try {
    if (typeof diaryAddActivity === 'function') diaryAddActivity(story, theme, char, session, memory, tier);
  } catch (e) {}

  const day = themeDailyCount(story);
  const repeat = day.runs >= THEME_REWARD_RUNS;
  let got = [];
  if (!repeat) {
    got = applyThemeReward(theme, char, dyn ? tier : undefined);
    day.runs++;
  }

  story.themeLastResult = {
    themeId: theme.id, charId: char.id, tier, memory, summary: dyn ? (session.closing || '') : '',
    rewards: got, repeat, ts: Date.now()
  };
  story.themeSession = null;
  window.__themeShowHome = false;
  saveStorage();
  renderThemeTab();
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
  themeCloseOverlay();
  renderThemeTab();
}

function closeThemeResult() {
  const story = window.state.stories.find(s => s.id === window.state.activeStoryId);
  if (!story) return;
  story.themeLastResult = null;
  window.__themeShowHome = true;
  saveStorage();
  themeCloseOverlay();
}

function renderThemeTab() {
  const root = document.getElementById('theme-body');
  if (!root) return;
  const story = ensureThemeStory(window.state.stories.find(s => s.id === window.state.activeStoryId));
  if (!story) { root.innerHTML = '<div class="theme-empty">Chưa chọn truyện.</div>'; return; }
  const chars = story.characters || [];
  if (!chars.length) {
    root.innerHTML = '<div class="theme-empty">Truyện chưa có nhân vật nào. Thêm nhân vật trong ⚙️ Cài Đặt để nhận phiếu hoạt động.</div>';
    return;
  }
  if (story.themeLastResult) { renderThemeResult(story); return; }
  if (story.themeSession && !window.__themeShowHome) { renderThemeSession(story); return; }
  renderThemeHome(story);
}

function renderThemeHome(story) {
  const root = document.getElementById('theme-body');
  const char = themeSelectedChar(story);
  const session = story.themeSession;
  const sessionTheme = session ? CHAT_THEMES[session.themeId] : null;
  const sessionTotal = session ? themeDynTotal(session, sessionTheme) : THEME_AI_ROUNDS;

  const charChips = story.characters.map(c => {
    const active = char && c.id === char.id;
    return `<button class="theme-char ${active ? 'active' : ''}" onclick="selectThemeChar('${c.id}')">
      <span class="theme-char-name">${escapeHtml(c.name)}</span>
      <span class="theme-char-lv">Lv.${themeCharLevel(c.id)}</span>
    </button>`;
  }).join('');

  const theme = char ? (CHAT_THEMES[char.activityId] || CHAT_THEMES.daily) : null;
  let card = '';
  if (theme) {
    const lv = themeCharLevel(char.id);
    const unlocked = themeIsUnlocked(theme, char, story);
    const runsLeft = Math.max(0, THEME_REWARD_RUNS - themeDailyCount(story).runs);
    const pct = Math.min(100, Math.round(lv / Math.max(1, theme.minLv) * 100));
    const aiArt = themeStageArt(char);
    const art = themeCharArt(char) || char.avatar;
    const busy = themeArtBusy(char);
    const canAi = themeHasApiKey();
    card = `<div class="activity-home ${unlocked ? '' : 'locked'} ${aiArt ? 'has-scene' : ''}">
      <div class="activity-home-art">
        ${art ? `<img data-theme-art="${escapeHtml(char.id)}" src="${escapeHtml(art)}" alt="${escapeHtml(char.name)}">` : `<span class="activity-home-glyph">${theme.icon}</span>`}
        <span class="activity-home-badge">${theme.icon}</span>
      </div>
      <div class="activity-home-body">
        <div class="activity-home-name">${theme.name}</div>
        <div class="activity-home-tag">${theme.tagline} · ${escapeHtml(char.name)} · ${themeAffectionStage(lv)}</div>
        <div class="activity-home-meta">${theme.minLv > 1 ? `Mốc Lv.${theme.minLv} · ` : ''}${themeRewardHint(theme)}</div>
        ${unlocked
          ? `<button class="btn btn-pink activity-start" onclick="startThemeActivity()">▶ Bắt đầu hoạt động</button>
             <div class="activity-done">${runsLeft > 0 ? `🎁 Còn ${runsLeft}/${THEME_REWARD_RUNS} lượt nhận thưởng hôm nay · chơi lại vẫn ghi ký ức` : `✓ Hôm nay đã nhận đủ ${THEME_REWARD_RUNS} lượt thưởng · chơi tiếp vẫn ghi ký ức`}</div>`
          : `<div class="activity-lock">
               <div class="activity-lock-line">🔒 Mở ở Lv.${theme.minLv} · hiện Lv.${lv}</div>
               <div class="activity-lock-bar"><span style="width:${pct}%"></span></div>
               <div class="activity-lock-note">Hoặc mở sớm bằng quà nhiệm vụ dành cho ${escapeHtml(char.name)}.</div>
             </div>`}
        ${canAi ? `<div class="activity-art-tools">
          <button class="btn btn-outline activity-ai-btn" onclick="generateThemeArt()" ${busy ? 'disabled' : ''}>${busy ? '⏳ Đang vẽ...' : (aiArt ? '✨ Vẽ lại dáng' : '✨ Tạo dáng AI')}</button>
        </div>` : ''}
      </div>
    </div>`;
  }

  const mems = story.themeMemories.slice(-4).reverse().map(m => {
    const t = CHAT_THEMES[m.themeId];
    return `<div class="theme-mem-line"><b>${t ? t.icon + ' ' + t.name : 'Hoạt động'}</b><span>${escapeHtml(m.text)}</span></div>`;
  }).join('');

  root.innerHTML = `
    <div class="theme-hero">
      <div class="theme-hero-title">🎭 Hoạt động riêng</div>
      <div class="theme-hero-sub">Mỗi nhân vật có một hoạt động riêng, mở theo cấp thân mật hoặc quà nhiệm vụ. Những gì xảy ra ở đây sẽ được nhân vật nhớ trong trò chuyện.</div>
    </div>
    <div class="theme-chars">${charChips}</div>
    ${sessionTheme ? `<div class="theme-resume">
      <div class="theme-resume-txt">Đang dở: <b>${sessionTheme.icon} ${sessionTheme.name}</b> · bước ${Math.min(session.step + 1, sessionTotal)}/${sessionTotal}</div>
      <div class="theme-resume-actions">
        <button class="btn btn-pink" onclick="window.__themeShowHome=false;renderThemeTab()">Tiếp tục</button>
        <button class="btn btn-outline" onclick="themeAbandonSession()">Bỏ</button>
      </div>
    </div>` : ''}
    ${card}
    <div class="theme-mem">
      <div class="theme-mem-title">Ký ức hoạt động gần đây</div>
      ${mems || '<div class="theme-mem-empty">Chưa có hoạt động nào. Bắt đầu hoạt động của nhân vật để tạo ký ức đầu tiên.</div>'}
    </div>
  `;

  if (char && !themeStageArt(char) && !char.cutout) {
    themeEnsureAutoCutout(char, url => {
      if (!url) return;
      const img = Array.from(root.querySelectorAll('[data-theme-art]')).find(x => x.getAttribute('data-theme-art') === char.id);
      if (img) img.src = url;
    });
  }
}

function renderThemeSession(story) {
  const session = story.themeSession;
  const theme = CHAT_THEMES[session.themeId];
  const char = (story.characters || []).find(c => c.id === session.charId);
  if (!theme || !char) { story.themeSession = null; saveStorage(); renderThemeTab(); return; }
  if (session.dyn) { renderThemeDynSession(story, session, theme, char); return; }
  const root = document.getElementById('theme-body');
  const step = theme.steps[session.step];
  if (!step) { finishThemeActivity(story, theme, char, session); return; }
  const me = themePlayerName(story);
  const effect = THEME_EFFECT[theme.id] || 'sparks';
  const aiArt = themeStageArt(char);
  const art = themeCharArt(char) || char.avatar;
  const busy = themeArtBusy(char);
  const canAi = themeHasApiKey();
  const picks = session.picks.map(p => `<div class="activity-log-line ${p.tone}">${escapeHtml(p.line)}</div>`).join('');
  const options = step.options.map((o, i) => `<button class="activity-choice" onclick="themeChoose(${i})">${escapeHtml(o.label)}</button>`).join('');
  const pct = Math.round(session.step / theme.steps.length * 100);
  root.innerHTML = `
    <div class="activity-stage fx-${effect} ${aiArt ? 'has-scene' : ''}">
      ${aiArt ? `<img class="activity-scene" src="${escapeHtml(aiArt)}" alt="">` : ''}
      ${aiArt ? '<div class="activity-scene-shade"></div>' : ''}
      ${themeFxHtml(effect)}
      <div class="activity-stage-head">
        <button class="activity-back" onclick="themeCloseOverlay()">←</button>
        <div class="activity-stage-title">${theme.icon} ${theme.name}</div>
        ${canAi ? `<button class="activity-ai-mini" title="Tạo dáng AI" onclick="generateThemeArt()" ${busy ? 'disabled' : ''}>${busy ? '⏳' : '✨'}</button>` : ''}
        <div class="activity-stage-step">${session.step + 1}/${theme.steps.length}</div>
      </div>
      <div class="activity-progress"><span style="width:${pct}%"></span></div>
      ${aiArt ? '' : `<div class="activity-art">
        ${art ? `<img data-theme-art="${escapeHtml(char.id)}" src="${escapeHtml(art)}" alt="${escapeHtml(char.name)}">` : `<span class="activity-art-glyph">${theme.icon}</span>`}
      </div>`}
      ${picks ? `<div class="activity-log">${picks}</div>` : ''}
      <div class="activity-dialogue">
        <div class="activity-speaker">${escapeHtml(char.name)}</div>
        <div class="activity-line">${escapeHtml(step.text(char.name, me))}</div>
      </div>
      <div class="activity-choices">${options}</div>
      <div class="activity-free">
        <input id="activity-free-input" type="text" maxlength="200" placeholder="Hoặc tự soạn câu trả lời..." onkeydown="if(event.key==='Enter'){event.preventDefault();themeFreeReply();}">
        <button class="btn btn-pink" onclick="themeFreeReply()">Gửi</button>
      </div>
      <button class="activity-abandon" onclick="themeAbandonSession()">Bỏ hoạt động</button>
    </div>
  `;

  if (!aiArt && !char.cutout) {
    themeEnsureAutoCutout(char, url => {
      if (!url) return;
      const img = Array.from(root.querySelectorAll('[data-theme-art]')).find(x => x.getAttribute('data-theme-art') === char.id);
      if (img) img.src = url;
    });
  }
}

function renderThemeDynSession(story, session, theme, char) {
  const root = document.getElementById('theme-body');
  if (!root) return;
  const effect = THEME_EFFECT[theme.id] || 'sparks';
  const aiArt = themeStageArt(char);
  const art = themeCharArt(char) || char.avatar;
  const artBusy = themeArtBusy(char);
  const canAi = themeHasApiKey();
  const total = THEME_AI_ROUNDS;
  const beat = session.beat;
  const closing = !!(beat && beat.end);
  const stepLabel = closing ? total : Math.min((session.step || 0) + 1, total);
  const pct = closing ? 100 : Math.round((session.step || 0) / total * 100);

  const logHtml = (session.log || []).map(e => {
    if (!e || !e.text) return '';
    if (e.k === 'me') return `<div class="activity-log-line me">${escapeHtml(e.text)}</div>`;
    if (e.k === 'char') return `<div class="activity-log-line char"><b>${escapeHtml(char.name)}</b>${escapeHtml(e.text)}</div>`;
    if (e.k === 'closing') return `<div class="activity-log-line closing">${escapeHtml(e.text)}</div>`;
    return `<div class="activity-log-line nar">${escapeHtml(e.text)}</div>`;
  }).join('');

  const echo = session.pendingEcho && session.pendingEcho.text
    ? `<div class="activity-log-line me">${escapeHtml(session.pendingEcho.text)}</div>` : '';
  const showBeat = beat && !beat.end && !session.busy;
  const narration = showBeat && beat.narration ? `<div class="activity-narration">${escapeHtml(beat.narration)}</div>` : '';
  const line = showBeat && beat.line
    ? `<div class="activity-dialogue"><div class="activity-speaker">${escapeHtml(char.name)}</div><div class="activity-line">${escapeHtml(beat.line)}</div></div>` : '';
  const options = showBeat
    ? (beat.choices || []).map((c, i) => `<button class="activity-choice" onclick="themeChoose(${i})">${escapeHtml(c)}</button>`).join('')
    : '';
  const thinking = session.busy
    ? `<div class="activity-thinking"><i></i><i></i><i></i><span>${session.step ? 'Diễn tiếp…' : 'Mở cảnh…'}</span></div>` : '';
  const error = session.error && !session.busy
    ? `<div class="activity-error">${escapeHtml(session.error)}<button class="activity-retry" onclick="themeDynRetry()">Thử lại</button></div>` : '';
  const finish = closing
    ? `<div class="activity-closing">${escapeHtml(session.closing || '')}</div>
       <button class="btn btn-pink activity-finish" onclick="themeDynFinish()">💮 Khép lại buổi này</button>` : '';

  root.innerHTML = `
    <div class="activity-stage fx-${effect} ${aiArt ? 'has-scene' : ''}">
      ${aiArt ? `<img class="activity-scene" src="${escapeHtml(aiArt)}" alt="">` : ''}
      ${aiArt ? '<div class="activity-scene-shade"></div>' : ''}
      ${themeFxHtml(effect)}
      <div class="activity-stage-head">
        <button class="activity-back" onclick="themeCloseOverlay()">←</button>
        <div class="activity-stage-title">${theme.icon} ${theme.name}</div>
        ${canAi ? `<button class="activity-ai-mini" title="Tạo dáng AI" onclick="generateThemeArt()" ${artBusy ? 'disabled' : ''}>${artBusy ? '⏳' : '✨'}</button>` : ''}
        <div class="activity-stage-step">${stepLabel}/${total}</div>
      </div>
      <div class="activity-progress"><span style="width:${pct}%"></span></div>
      ${aiArt ? '' : `<div class="activity-art">
        ${art ? `<img data-theme-art="${escapeHtml(char.id)}" src="${escapeHtml(art)}" alt="${escapeHtml(char.name)}">` : `<span class="activity-art-glyph">${theme.icon}</span>`}
      </div>`}
      ${logHtml || echo ? `<div class="activity-log" data-dyn-log>${logHtml}${echo}</div>` : ''}
      ${narration}
      ${line}
      ${thinking}
      ${error}
      ${finish}
      ${options ? `<div class="activity-choices">${options}</div>` : ''}
      ${showBeat ? `<div class="activity-free">
        <input id="activity-free-input" type="text" maxlength="200" placeholder="Hoặc tự soạn: *hành động* hoặc &quot;lời nói&quot;..." onkeydown="if(event.key==='Enter'){event.preventDefault();themeFreeReply();}">
        <button class="btn btn-pink" onclick="themeFreeReply()">Gửi</button>
      </div>` : ''}
      <button class="activity-abandon" onclick="themeAbandonSession()">Bỏ hoạt động</button>
    </div>
  `;

  const log = root.querySelector('[data-dyn-log]');
  if (log) log.scrollTop = log.scrollHeight;

  if (!aiArt && !char.cutout) {
    themeEnsureAutoCutout(char, url => {
      if (!url) return;
      const img = Array.from(root.querySelectorAll('[data-theme-art]')).find(x => x.getAttribute('data-theme-art') === char.id);
      if (img) img.src = url;
    });
  }
}

function renderThemeResult(story) {
  const root = document.getElementById('theme-body');
  const r = story.themeLastResult;
  const theme = CHAT_THEMES[r.themeId];
  const char = (story.characters || []).find(c => c.id === r.charId);
  if (!theme || !char) { story.themeLastResult = null; saveStorage(); renderThemeTab(); return; }
  const rewards = r.rewards.length ? r.rewards.join(' · ') : (r.repeat ? `Hôm nay đã nhận đủ ${THEME_REWARD_RUNS} lượt thưởng cho hoạt động, lần này chỉ ghi ký ức.` : 'Không có phần thưởng.');
  const effect = r.tier === 2 ? 'fireworks' : (r.tier === 0 ? 'sparks' : (THEME_EFFECT[theme.id] || 'sparks'));
  const aiArt = themeStageArt(char);
  const art = themeCharArt(char) || char.avatar;
  root.innerHTML = `
    <div class="theme-result tier-${r.tier}">
      <div class="theme-result-fx">${themeFxHtml(effect)}</div>
      ${aiArt ? `<img class="theme-result-art is-scene" src="${escapeHtml(aiArt)}" alt="">` : (art ? `<img class="theme-result-art" src="${escapeHtml(art)}" alt="">` : '')}
      <div class="theme-result-icon">${themeTierIcon(r.tier)}</div>
      <div class="theme-result-title">${themeTierLabel(r.tier)}</div>
      <div class="theme-result-sub">${theme.icon} ${theme.name} · ${escapeHtml(char.name)}</div>
      <div class="theme-result-memory">${escapeHtml(r.summary || r.memory)}</div>
      <div class="theme-result-rewards">${rewards}</div>
      <div class="theme-result-actions">
        <button class="btn btn-pink" onclick="themeCloseOverlay()">💬 Về trò chuyện</button>
      </div>
    </div>
  `;
}

window.renderThemeTab = renderThemeTab;
window.startThemeActivity = startThemeActivity;
window.themeChoose = themeChoose;
window.themeFreeReply = themeFreeReply;
window.themeDynRetry = themeDynRetry;
window.themeDynFinish = themeDynFinish;
window.selectThemeChar = selectThemeChar;
window.themeBackToHome = themeBackToHome;
window.themeAbandonSession = themeAbandonSession;
window.closeThemeResult = closeThemeResult;
window.generateThemeArt = generateThemeArt;
window.themeMakeCutout = themeMakeCutout;
window.themeOpenOverlay = themeOpenOverlay;
window.themeCloseOverlay = themeCloseOverlay;
window.useActivityItem = useActivityItem;
window.themeGrantActivityItem = themeGrantActivityItem;
window.themeActivityItemFor = themeActivityItemFor;
window.themeMaybeDropTicket = themeMaybeDropTicket;
window.themeShowRewardItems = themeShowRewardItems;
window.themeUseGrantedItem = themeUseGrantedItem;
