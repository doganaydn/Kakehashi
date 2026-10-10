"""Yerel Android araçlarını doğrulanmış arşivlerden proje içine kurar."""
import concurrent.futures
import hashlib
import json
import pathlib
import urllib.request
import zipfile
import requests

ROOT = pathlib.Path(__file__).resolve().parents[1]/'.local-tools'

def download(url,path,checksum):
    if path.exists() and hashlib.sha256(path.read_bytes()).hexdigest()==checksum: return
    temp=path.with_suffix('.download')
    with requests.get(url,timeout=60,stream=True) as response, temp.open('wb') as out:
        response.raise_for_status()
        for chunk in response.iter_content(1024*1024): out.write(chunk)
    if hashlib.sha256(temp.read_bytes()).hexdigest()!=checksum: raise ValueError('Archive checksum mismatch')
    temp.replace(path)

def extract(path,destination):
    destination.mkdir(parents=True,exist_ok=True)
    with zipfile.ZipFile(path) as archive:
        for member in archive.infolist():
            if not (destination/member.filename).resolve().is_relative_to(destination.resolve()): raise ValueError('Unsafe archive path')
        archive.extractall(destination)

def main():
    ROOT.mkdir(exist_ok=True)
    response=requests.get('https://api.github.com/repos/adoptium/temurin17-binaries/releases/latest',timeout=30)
    response.raise_for_status(); assets=response.json()['assets']
    package=next(a for a in assets if a['name'].startswith('OpenJDK17U-jdk_x64_windows_hotspot_') and a['name'].endswith('.zip'))
    checksum=next(a for a in assets if a['name']==package['name']+'.sha256.txt')
    response=requests.get(checksum['browser_download_url'],timeout=30); response.raise_for_status(); sha=response.text.split()[0]
    jobs=[('jdk',package['browser_download_url'],sha),('sdk-tools','https://dl.google.com/android/repository/commandlinetools-win-15859902_latest.zip','90ae805d20434428bffcb699c290860f19bb5f66a67e6b330067e3de801fb04a')]
    def prepare(job):
        name,url,sha=job; path=ROOT/(name+'.zip'); download(url,path,sha)
        extract(path,ROOT/name); print(name+' downloaded and verified',flush=True)
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool: list(pool.map(prepare,jobs))
    jdk=next((ROOT/'jdk').glob('jdk-*'))
    sdk=ROOT/'android-sdk'; latest=sdk/'cmdline-tools/latest'; latest.parent.mkdir(parents=True,exist_ok=True)
    if not latest.exists(): (ROOT/'sdk-tools/cmdline-tools').rename(latest)
    (ROOT/'paths.json').write_text(json.dumps({'jdk':str(jdk),'sdk':str(sdk)},indent=2),encoding='utf-8')
    print('Portable tools ready; SDK packages still need installation.',flush=True)

if __name__=='__main__': main()
