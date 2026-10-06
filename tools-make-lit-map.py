import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter
im=Image.open('IMG20260822122932.jpg').convert('L').crop((30,350,2970,3510))
W=2000; H=round(W*im.size[1]/im.size[0]); print(W,H)
g=np.asarray(im.resize((W,H),Image.LANCZOS),dtype=np.float32)/255
# flatten lighting / glare
g=gaussian_filter(g,0.9)
g=g/(gaussian_filter(g,50)+0.02)
hp=(g-gaussian_filter(g,2.0))+0.6*(g-gaussian_filter(g,7.0))
hp=np.clip(hp,0,None)
loc=np.sqrt(gaussian_filter(hp**2,30))+0.01        # local contrast normalise
E=hp/(loc*3.2)
E=np.clip((E-0.35)/0.65,0,1)**1.1
E=gaussian_filter(E,0.6)
E=np.clip(E*1.3,0,1)
rgb=np.stack([E*1.0,E*0.70,E*0.30],-1)
Image.fromarray((rgb*255).astype(np.uint8)).save('door-lit.jpg',quality=74,optimize=True)
import os;print(os.path.getsize('door-lit.jpg'))
# preview crop
