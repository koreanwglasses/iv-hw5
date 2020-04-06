import cv2
from glob import glob
import numpy as np
from sklearn.manifold import TSNE
from sklearn.decomposition import PCA
from sklearn.cluster import KMeans
import matplotlib.pyplot as plt


# Used to store the clusters and output them JSON
class ClusterNode:
  def __init__(self, name=None, preview=None, size=None, x=None, y=None):
    self.name = name
    self.preview = preview
    self.children = []
    self.size = size
    self.x = x
    self.y = y

  def json(self, level=0):
    indent = ' '*(2*level)
    result = indent + '{\n'

    if self.name is not None:
      result += indent + '  "name" : "' + self.name + '",\n'

    if self.preview is not None:
      result += indent + '  "preview" : "' + self.preview + '",\n'

    if self.size is not None:
      result += indent + '  "size" : ' + str(self.size) + ',\n'

    if self.x is not None:
      result += indent + ' "x" : ' + str(self.x) + ',\n'

    if self.y is not None:
      result += indent + ' "y" : ' + str(self.y) + ',\n'

    if self.children != []:
      result += indent + '  "children" : [\n'

      for subcluster in self.children:
        result += subcluster.json(level=level + 2) + ',\n'
      result = result[:-2] + '\n'
      result += indent + '  ]\n,'

    result = result[:-2] + '\n'
    result += indent + '}'
    
    return result

# Prepare input data
print("Initializing images...")
filenames = glob('./images/*.JPEG')
images = [cv2.imread(fname) for fname in filenames]
image_shape = images[0].shape
X = np.stack(images).reshape(len(images), -1)  

# Reduce dimensionality
print("Performing PCA...")
X_reduced = PCA(n_components=10).fit_transform(X)

print("Trying TSNE...")
X_embedded = TSNE(n_components=2).fit_transform(X_reduced)

# plt.scatter(X_embedded[:, 0], X_embedded[:, 1])
# plt.show()

print("Comparing K-means...")
# k-means on unreduced input points
kmeans = KMeans(n_clusters=7).fit(X)

plt.scatter(X_embedded[:, 0], X_embedded[:, 1], c=kmeans.labels_, cmap="Accent")
plt.show()