#!/usr/bin/env python3
"""index.html + css + js + 이미지를 하나로 합쳐 novacare-site.html 을 만듭니다.
더블클릭만으로 열리는 단일 파일입니다. 문의 폼과 처리방침은 같은 페이지 안의 섹션으로 들어갑니다.
사용: python3 build_single.py
"""
import base64, mimetypes, re
from pathlib import Path

root = Path(__file__).parent
rd = lambda p: (root / p).read_text(encoding='utf-8')

html = rd('index.html')
contact = rd('contact.html')

# 1) css / js 인라인
html = html.replace('<link rel="stylesheet" href="css/style.css" />', '<style>\n' + rd('css/style.css') + '\n</style>')
html = html.replace('<script src="js/main.js"></script>', '<script>\n' + rd('js/main.js') + '\n</script>')

# 2) 이미지 data URI
def data_uri(m):
    f = root / m.group(1)
    mime = mimetypes.guess_type(f.name)[0] or 'image/webp'
    return 'src="data:%s;base64,%s"' % (mime, base64.b64encode(f.read_bytes()).decode())
html = re.sub(r'src="(assets/img/[^"]+)"', data_uri, html)

# 3) 문의 링크는 같은 페이지의 #inquiry 로, 유형은 data-type 으로 전달
html = re.sub(r'href="contact\.html\?type=(\w+)"', r'href="#inquiry" data-type="\1"', html)
html = html.replace('href="contact.html"', 'href="#inquiry"')
html = html.replace('href="privacy.html"', 'href="#privacy"')

# 4) contact.html 의 폼과 스크립트를 섹션으로 삽입
form = re.search(r'<form id="form".*?</form>', contact, re.S).group(0)
form = form.replace('target="_blank" rel="noopener"', '')
script = re.search(r'<script>\s*\(function \(\) \{.*?\}\)\(\);\s*</script>', contact, re.S).group(0)
script = script.replace("var q = new URLSearchParams(location.search).get('type');",
                        "var q = new URLSearchParams(location.search).get('type');\n"
                        "  document.addEventListener('click', function (e) { var a = e.target.closest('a[data-type]'); if (a && form.type.querySelector('option[value=\"' + a.dataset.type + '\"]')) form.type.value = a.dataset.type; });")
section = '''
<section class="section" id="inquiry">
  <div class="wrap form-grid">
    <div>
      <p class="eyebrow">CONTACT</p>
      <h2 class="h2">도입 문의</h2>
      <p class="lead">귀사의 돌봄 환경과 운영 목적을 알려 주세요. 접수 후 담당자가 적용 가능한 범위와 일정을 협의합니다.</p>
    </div>
    ''' + form + '''
  </div>
</section>

<section class="section gray" id="privacy">
  <div class="wrap prose">
    <h2 class="h2" style="font-size:clamp(1.5rem,1rem+1.5vw,2.25rem)">개인정보처리방침</h2>
    <p class="notice dev" style="margin-top:24px">초안 자리입니다. 법무·보안 검토를 거친 실제 처리방침으로 교체한 뒤 게시해야 합니다.</p>
    <h2>문의 접수 시 수집하는 항목</h2><ul><li>기관명, 담당자 이름, 이메일, 전화번호(선택), 문의 내용</li></ul>
    <h2>수집·이용 목적</h2><p>도입 상담, 데모 신청, 제휴 문의에 대한 응대.</p>
    <h2>보관 기간·위탁·파기</h2><p>보관 기간, 처리 위탁 여부, 파기 절차는 확정 후 이곳에 기재합니다.</p>
  </div>
</section>
</main>
'''
html = html.replace('</main>', section, 1)
html = html.replace('</body>', script + '\n</body>')

out = root / 'novacare-site.html'
out.write_text(html, encoding='utf-8')
print(out, round(out.stat().st_size / 1024), 'KB')
