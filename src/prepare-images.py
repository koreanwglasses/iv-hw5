'''
Prepare images for display/processing. We want to scale everything down so we
dont take up a ton of space on the disk. It is not necessary to run this module unless
the raw images are changed.
'''
import cv2
import os
from glob import glob

def process(filename):
  img = cv2.imread(filename)
  img = cv2.resize(img, (64, 48))

  outname = './images/' + os.path.basename(filename)
  cv2.imwrite(outname, img, [cv2.IMWRITE_JPEG_QUALITY, 70])

filenames = glob('./raw-images/*.JPEG') 
for i, filename in enumerate(filenames):
  process(filename)
  print(f'Processed {i+1}/{len(filenames)}', end='\r')
print('\nDone!')